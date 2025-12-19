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
      <div className="nav-brand" onClick={() => navigate('/voting')}>White Matrix</div>
      <div className="nav-links">
        <button onClick={() => navigate('/voting')} className="nav-item">Vote</button>
        <button onClick={() => navigate('/results')} className="nav-item">Results</button>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
}