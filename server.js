// server.js
const express = require('express');
// No import needed — native fetch is built-in in Node 18+
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 5000;

app.get('/api/charger', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing lat or lon in query' });
  }

  const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${lat}&longitude=${lon}&distance=10&distanceunit=KM&maxresults=1&compact=true&verbose=false`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': '13f4ceea-89da-42c3-95d8-4d420d0fd0f2'
      }
    });

    if (!response.ok) {
      const text = await response.text(); // log raw text if error
      console.error(`Open Charge Map error ${response.status}:`, text);
      return res.status(response.status).json({ error: `OCM API Error: ${response.status}` });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Proxy server error:', error);
    res.status(500).json({ error: 'Error fetching data from Open Charge Map' });
  }
});


app.listen(PORT, () => {
  console.log(`⚡ Proxy server running at http://localhost:${PORT}`);
});
