const dns = require('dns').promises;

// Function to resolve a domain for a specific record type
async function getDNSRecord(domain, recordType) {
  try {
    const records = await dns.resolve(domain, recordType);
    return records.length ? { [recordType]: records } : null;
  } catch (err) {
    // If there is an error (e.g., record not found), return null
    return null;
  }
}

module.exports = async (req, res) => {
  const domain = req.query.domain || 'example.com'; // replace with your target domain
  const recordTypes = ['A', 'AAAA', 'MX', 'CNAME', 'NS', 'TXT', 'SRV', 'PTR', 'SOA'];

  const results = await Promise.all(recordTypes.map(type => getDNSRecord(domain, type)));

  // Filter out null entries and combine all valid results into a single object
  const validResults = results.filter(result => result !== null).reduce((acc, curr) => {
    return { ...acc, ...curr };
  }, {});

  if (Object.keys(validResults).length === 0) {
    res.status(404).json({ error: 'No DNS records found' });
  } else {
    res.status(200).json({ domain, records: validResults });
  }
};
