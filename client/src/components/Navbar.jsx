import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Tell the backend to destroy the session
    window.location.href = 'http://localhost:5000/auth/logout';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand" onClick={() => navigate('/voting')} style={{cursor: 'pointer'}}>
          One Vote App
        </div>
        <div className="navbar-links">
          <button onClick={() => navigate('/voting')} className="navbar-link">Vote</button>
          <button onClick={() => navigate('/results')} className="navbar-link">Results</button>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </div>
    </nav>
  );
}