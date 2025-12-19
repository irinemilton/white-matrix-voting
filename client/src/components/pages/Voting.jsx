import React, { useEffect, useState } from 'react';
import Navbar from '../Navbar';
import '../../App.css';

export default function Voting() {
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState('');

  // Fetch candidates on page load
  useEffect(() => {
    fetch('http://localhost:5000/api/candidates', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setCandidates(data))
      .catch((err) => console.error("Error fetching candidates:", err));
  }, []);

  const handleVote = async (candidateId) => {
    try {
      const response = await fetch('http://localhost:5000/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ candidateId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage("✅ " + data.message);
        // Optional: Redirect to results after voting
        // window.location.href = '/results';
      } else {
        setMessage("❌ " + data.error);
      }
    } catch (error) {
      setMessage("❌ Connection error. Is the server running?");
    }
  };

  return (
    <div className="container">
      <Navbar />
      <h1 className="title">Cast Your Support</h1>
      {message && <div className="alert">{message}</div>}
      
      <div className="candidate-grid">
        {candidates.map((person) => (
          <div key={person.id} className="candidate-card">
            <h2>{person.name}</h2>
            <p className="bio">{person.description}</p>
            <button 
              className="btn btn-vote" 
              onClick={() => handleVote(person.id)}
            >
              Vote for {person.name}
            </button>
          </div>
        ))}
      </div>
      <div style={{marginTop: '20px'}}>
        <a href="/results" className="link">View Live Results</a>
      </div>
    </div>
  );
}