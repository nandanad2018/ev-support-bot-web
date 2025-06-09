export default async function handler(req, res) {
  const { lat, lon } = req.query;
  const radius = 5;

  try {
    const response = await fetch(`https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lon}&distance=${radius}&maxresults=10&compact=true&verbose=false&key=demo`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching charger data:', error);
    res.status(500).json({ error: 'Failed to fetch chargers' });
  }
}