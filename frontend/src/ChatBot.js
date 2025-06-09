import React, { useState } from 'react';
import './ChatBot.css';

function ChatBot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'bot', text: "Hi! I'm your EV Support Bot. Ask me about charging stations." }]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    setInput('');
  };

  return (
    <div className="chatbot">
      <div className="chat-window">
        {messages.map((m, i) => <div key={i} className={m.role}>{m.text}</div>)}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
    </div>
  );
}

export default ChatBot;