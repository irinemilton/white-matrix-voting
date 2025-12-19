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
    <div>
      <Navbar />
      <div className="container">
        <h1 className="title">Live Results</h1>

        <div className="dashboard">
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Vote Counts</h2>
              <p className="section-subtitle">Current voting statistics</p>
            </div>

            <div className="candidate-grid">
              {results.map((candidate) => (
                <div key={candidate.name} className="candidate-card">
                  <h2>{candidate.name}</h2>
                  <p className="votes">Votes: {candidate.votes}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Voter Registry</h2>
              <p className="section-subtitle">Verified participants who have cast their votes</p>
            </div>

            <div className="results-table-container">
              <table className="results-table">
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
        </div>

        <div style={{textAlign: 'center', marginTop: '2rem'}}>
          <a href="/voting" className="btn btn-secondary">Back to Voting</a>
        </div>
      </div>
    </div>
  );
}