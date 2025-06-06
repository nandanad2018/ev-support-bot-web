// ev_support_bot.jsx
import React, { useState, useEffect, useRef } from 'react';

export default function EVSupportBot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I’m your EV Support Bot. Ask me anything about your EV!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [chargerIndex, setChargerIndex] = useState(0);
  const [uniqueChargers, setUniqueChargers] = useState([]);
  const chatRef = useRef(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('Geolocation success:', pos.coords);
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => console.warn('Geolocation error:', err.message)
    );
  }, []);

  useEffect(() => {
    console.log('Current location state:', location);
  }, [location]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    let botResponse = '';

    if (/nearest charger/i.test(userMessage.text)) {
      console.log('Detected charger question');
      if (location) {
        console.log('Using location:', location);
        setChargerIndex(0);
        botResponse = await getNearestCharger(location, 0);
      } else {
        console.warn('Location not available');
        botResponse = 'I couldn’t access your location to find nearby chargers. Please enable location services.';
      }
    } else if (/next charger/i.test(userMessage.text)) {
      const nextIndex = chargerIndex + 1;
      setChargerIndex(nextIndex);
      botResponse = await getNearestCharger(location, nextIndex);
    } else {
      botResponse = await getBotReply([...messages, userMessage]);
    }

    setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    setLoading(false);
  };

  const getNearestCharger = async ({ lat, lon }, index = 0) => {
    try {
      const url = `http://localhost:5000/api/charger?lat=${lat}&lon=${lon}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return `API Error: Received status ${response.status}`;
      }

      if (!Array.isArray(data) || data.length === 0) {
        return 'Sorry, no charging stations found nearby.';
      }

      const unique = [];
      const seen = new Set();

      for (const charger of data) {
        const address = charger.AddressInfo;
        const key = `${address.Latitude}-${address.Longitude}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(charger);
        }
      }

      setUniqueChargers(unique);

      const charger = unique[index] || unique[unique.length - 1];
      const address = charger.AddressInfo;
      const mapUrl = `https://www.google.com/maps?q=${address.Latitude},${address.Longitude}`;
      return `Nearest charger: ${address.Title}, located at ${address.AddressLine1}, ${address.Town}, ${address.StateOrProvince}. [View on Map](${mapUrl})`;
    } catch (error) {
      console.error('Proxy fetch error:', error);
      return 'Sorry, I could not fetch charger data at this time.';
    }
  };

  const getBotReply = async (chatHistory) => {
    try {
      const openaiMessages = chatHistory.map(msg => ({
        role: msg.sender === 'bot' ? 'assistant' : 'user',
        content: msg.text
      }));

      if (location) {
        openaiMessages.unshift({
          role: 'system',
          content: `The user is located near latitude ${location.lat} and longitude ${location.lon}. You are an EV expert helping Australian users with EV ownership, charging, rebates, etc.`
        });
      } else {
        openaiMessages.unshift({
          role: 'system',
          content: 'You are an EV expert helping Australian users with EV ownership, charging, rebates, etc.'
        });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: openaiMessages
        })
      });

      const data = await response.json();

      if (data.error) {
        return `API Error: ${data.error.message}`;
      }

      return data.choices?.[0]?.message?.content || 'Sorry, I had trouble understanding that.';
    } catch (error) {
      return 'Oops! Something went wrong connecting to OpenAI.';
    }
  };

  const handleReset = () => {
    setMessages([{ sender: 'bot', text: 'Hi! I’m your EV Support Bot. Ask me anything about your EV!' }]);
    setInput('');
    setChargerIndex(0);
  };

  return (
    <div style={{ maxWidth: '100%', padding: '1rem', fontFamily: 'Arial', margin: 'auto' }}>
      <div ref={chatRef} style={{ height: '60vh', overflowY: 'auto', border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ color: msg.sender === 'bot' ? 'blue' : 'green', marginBottom: '0.5rem' }}>
            <strong>{msg.sender === 'bot' ? 'Bot' : 'You'}:</strong> <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>') }} />
          </div>
        ))}
        {loading && <div style={{ color: 'blue' }}><strong>Bot:</strong> Typing...</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your EV question..."
          style={{ padding: '0.75rem', fontSize: '1rem' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleSend} disabled={loading} style={{ flex: 1, padding: '0.75rem' }}>Send</button>
          <button onClick={handleReset} disabled={loading} style={{ flex: 1, padding: '0.75rem' }}>Reset</button>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '1rem' }}>
          🚗 Powered by Open Charge Map & OpenAI | 💡 <a href="#">Upgrade to Pro</a>
        </div>
      </div>
    </div>
  );
}

