import React, { useEffect, useState } from 'react';
import Navbar from '../Navbar';
import '../../App.css';

export default function Results() {
  const [results, setResults] = useState([]);
  const [voters, setVoters] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/results', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setResults(data))
      .catch((err) => console.error("Error fetching results:", err));

    fetch('http://localhost:5000/api/voters', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setVoters(data))
      .catch((err) => console.error("Error fetching voters:", err));
  }, []);

  return (
    <div className="container">
      <Navbar />
      <h1 className="title">Live Results</h1>
      
      <div className="results-section">
        <h2>Vote Counts</h2>
        <div className="candidate-grid">
          {results.map((candidate) => (
            <div key={candidate.name} className="candidate-card">
              <h2>{candidate.name}</h2>
              <p className="votes">Votes: {candidate.votes}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="voters-section">
        <h2>Voter List</h2>
        <p>The following members have successfully cast their support:</p>
        
        <div className="voter-table-container">
          <table className="voter-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Provider</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>
              {voters.length > 0 ? (
                voters.map((v, index) => (
                  <tr key={index}>
                    <td>{v.display_name}</td>
                    <td>
                      {v.linkedin_id ? 'LinkedIn' : 'Google'}
                    </td>
                    <td>
                      {v.linkedin_profile_url ? (
                        <a href={v.linkedin_profile_url} target="_blank" rel="noopener noreferrer" className="link">
                          View Profile
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No votes recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <a href="/voting" className="btn btn-secondary">Back to Voting</a>
    </div>
  );
}