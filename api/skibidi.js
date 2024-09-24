const dns = require('dns').promises;

module.exports = async (req, res) => {
  const domain = 'is-a.dev'; // replace with the domain you want to look up

  try {
    // Perform an A record lookup (IPv4)
    const records = await dns.resolve(domain, 'A');
    res.status(200).json({ domain, records });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
