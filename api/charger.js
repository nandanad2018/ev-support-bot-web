// api/charger.js
export default async function handler(req, res) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  const apiKey = process.env.OPENCHARGEMAP_API_KEY;
  const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lon}&maxresults=10&compact=true&verbose=false&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data || 'Unknown API error' });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Open Charge Map fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch charger data' });
  }
}
