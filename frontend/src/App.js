import React, { useState, useEffect } from 'react';
import ChatBot from './ChatBot';
import './App.css';

function App() {
  const [chargers, setChargers] = useState([]);
  const [lat, setLat] = useState(-37.8136);
  const [lon, setLon] = useState(144.9631);

  useEffect(() => {
    fetch(`/api/charger?lat=${lat}&lon=${lon}`)
      .then(res => res.json())
      .then(setChargers)
      .catch(err => console.error('API fetch error:', err));
  }, [lat, lon]);

  return (
    <div className="App">
      <h1>EV Charger Finder</h1>
      <input value={lat} onChange={(e) => setLat(+e.target.value)} />
      <input value={lon} onChange={(e) => setLon(+e.target.value)} />
      <div className="card-container">
        {chargers.map(ch => (
          <div key={ch.ID} className="card">
            <h3>{ch.AddressInfo.Title}</h3>
            <p>{ch.AddressInfo.AddressLine1}</p>
            <a href={`https://maps.google.com/?q=${ch.AddressInfo.Latitude},${ch.AddressInfo.Longitude}`} target="_blank">Map</a>
          </div>
        ))}
      </div>
      <ChatBot />
    </div>
  );
}

export default App;