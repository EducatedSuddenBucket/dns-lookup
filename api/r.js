const net = require('net');
const dns = require('dns').promises;

const defaultPort = 25565;

function createVarInt(value) {
  const bytes = [];
  while (true) {
    if ((value & 0xffffff80) === 0) {
      bytes.push(value);
      return Buffer.from(bytes);
    }
    bytes.push(value & 0x7f | 0x80);
    value >>>= 7;
  }
}

function createPacket(id, data) {
  const idBuffer = createVarInt(id);
  const lengthBuffer = createVarInt(idBuffer.length + data.length);
  return Buffer.concat([lengthBuffer, idBuffer, data]);
}

function readVarInt(buffer, offset) {
  let value = 0;
  let size = 0;
  let byte;
  do {
    byte = buffer[offset++];
    value |= (byte & 0x7f) << (size++ * 7);
    if (size > 5) {
      throw new Error('VarInt is too big');
    }
  } while (byte & 0x80);
  return [value, offset];
}

function connectToServer(host, port) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let buffer = Buffer.alloc(0);
    let serverInfo;
    let pingStartTime;

    client.connect(port, host, () => {
      const hostBuffer = Buffer.from(host, 'utf8');
      const portBuffer = Buffer.alloc(2);
      portBuffer.writeUInt16BE(port, 0);
      const handshakeData = Buffer.concat([
        createVarInt(47),
        createVarInt(hostBuffer.length),
        hostBuffer,
        portBuffer,
        createVarInt(1)
      ]);
      const handshakePacket = createPacket(0x00, handshakeData);
      client.write(handshakePacket);
      const statusRequestPacket = createPacket(0x00, Buffer.alloc(0));
      client.write(statusRequestPacket);
    });

    client.on('data', (data) => {
      buffer = Buffer.concat([buffer, data]);
      try {
        let offset = 0;
        let [length, newOffset] = readVarInt(buffer, offset);
        offset = newOffset;
        if (buffer.length >= offset + length) {
          let [packetId, newOffset] = readVarInt(buffer, offset);
          offset = newOffset;
          if (packetId === 0x00) {
            let [jsonLength, newOffset] = readVarInt(buffer, offset);
            offset = newOffset;
            const jsonResponse = buffer.slice(offset, offset + jsonLength).toString('utf8');
            serverInfo = JSON.parse(jsonResponse);
            const pingPacket = createPacket(0x01, Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]));
            pingStartTime = process.hrtime.bigint();
            client.write(pingPacket);
            buffer = buffer.slice(offset + jsonLength);
          } else if (packetId === 0x01) {
            const latency = Number(process.hrtime.bigint() - pingStartTime) / 1e6;
            serverInfo.latency = Math.round(latency);
            resolve(serverInfo);
            client.destroy();
          }
        }
      } catch (e) {
        reject(e);
      }
    });

    client.on('error', (err) => {
      reject(err);
    });

    client.on('close', () => {});
  });
}

function parseHostAndPort(input) {
  const [host, port] = input.split(':');
  return {
    host: host,
    port: port ? parseInt(port, 10) : defaultPort
  };
}

async function pingServer(input) {
  const { host, port } = parseHostAndPort(input);
  try {
    const addresses = await dns.resolveSrv(`_minecraft._tcp.${host}`);
    const address = addresses[0];
    return await connectToServer(address.name, address.port);
  } catch {
    return await connectToServer(host, port);
  }
}

module.exports = async (req, res) => {
  const { serverAddress } = req.query;
  
  if (!serverAddress) {
    return res.status(400).json({ error: 'Missing serverAddress parameter' });
  }

  try {
    const serverInfo = await pingServer(serverAddress);
    res.status(200).json({ serverAddress, serverInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
