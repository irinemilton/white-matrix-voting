import React, { useEffect, useState } from 'react';
import Navbar from '../Navbar';
import '../../App.css';
import { API_BASE_URL } from '../../config';
import { candidateDetails, defaultCandidateDetails } from '../../config/candidates';

export default function Voting() {
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch candidates on page load
  useEffect(() => {
    console.log('Voting component mounted, fetching candidates...');
    fetch(`${API_BASE_URL}/api/candidates`, { credentials: 'include' })
      .then((res) => {
        console.log('Candidates API response status:', res.status);
        return res.json();
      })
      .then((data) => {
        console.log('Candidates data received:', data);
        setCandidates(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching candidates:", err);
        setMessage("❌ Failed to load candidates. Please check if the server is running.");
        setLoading(false);
      });
  }, []);

  const handleVote = async (candidateId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vote`, {
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
    <div>
      <Navbar />
      <div className="container">
        <h1 className="title">Cast Your Support</h1>
        {message && (
          <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}
        
        {loading ? (
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <div>Loading candidates...</div>
          </div>
        ) : candidates.length === 0 ? (
          <div style={{textAlign: 'center', padding: '2rem'}}>
            <div>No candidates available at the moment.</div>
          </div>
        ) : (

        <div className="dashboard">
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Available Candidates</h2>
              <p className="section-subtitle">Select your preferred candidate to cast your vote</p>
            </div>

            <div className="candidate-grid">
              {candidates.map((person) => {
                // Merge database data with frontend config
                const details = candidateDetails[person.id] || defaultCandidateDetails;
                const mergedCandidate = { ...person, ...details };
                
                return (
                  <div key={person.id} className="candidate-card" style={{ borderTop: `4px solid ${mergedCandidate.color}` }}>
                    <div className="candidate-header">
                      <div className="candidate-photo-container">
                        <img 
                          src={mergedCandidate.photo} 
                          alt={person.name}
                          className="candidate-photo"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200?text=' + encodeURIComponent(person.name.charAt(0));
                          }}
                        />
                      </div>
                      <div className="candidate-info">
                        <h2 className="candidate-name">{person.name}</h2>
                        <p className="candidate-tagline">{mergedCandidate.tagline}</p>
                        <p className="candidate-experience">{mergedCandidate.experience}</p>
                      </div>
                    </div>
                    
                    <div className="candidate-body">
                      <p className="bio">{person.description}</p>
                      
                      {mergedCandidate.keyPoints && mergedCandidate.keyPoints.length > 0 && (
                        <div className="candidate-key-points">
                          <h4>Key Highlights:</h4>
                          <ul>
                            {mergedCandidate.keyPoints.map((point, idx) => (
                              <li key={idx}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {person.linkedin_url && (
                        <div className="candidate-linkedin">
                          <a 
                            href={person.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="linkedin-link"
                            style={{ color: mergedCandidate.color }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            View LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="candidate-footer">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleVote(person.id)}
                        style={{ 
                          backgroundColor: mergedCandidate.color,
                          width: '100%',
                          marginTop: '1rem'
                        }}
                      >
                        Vote for {person.name}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Quick Actions</h2>
              <p className="section-subtitle">Navigate to other sections</p>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <a href="/results" className="btn btn-secondary">
                View Live Results
              </a>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}