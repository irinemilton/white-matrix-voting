import React from 'react';
import '../../App.css';
import { API_BASE_URL } from '../../config';

export default function Login() {
  // Directly triggers the Passport.js flow on your Node server
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleLinkedinLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/linkedin`;
  };

  return (
    <div className="container" style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div className="section" style={{maxWidth: '400px', width: '100%', margin: '0'}}>
        <div className="section-header" style={{textAlign: 'center'}}>
          <h1 className="section-title" style={{fontSize: '2rem', marginBottom: '0.5rem'}}>One Vote App</h1>
          <p className="section-subtitle">Secure Candidate Support Portal</p>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem'}}>
          {/* Google Auth Button */}
          <button className="btn btn-secondary" onClick={handleGoogleLogin} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'}}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              style={{width: '20px', height: '20px', flexShrink: 0}}
            />
            <span>Continue with Google</span>
          </button>

          {/* LinkedIn Auth Button */}
          <button className="btn btn-primary" onClick={handleLinkedinLogin} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'}}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
              alt="LinkedIn"
              style={{width: '20px', height: '20px', flexShrink: 0}}
            />
            <span>Continue with LinkedIn</span>
          </button>
        </div>

        <div style={{textAlign: 'center', color: '#64748b', fontSize: '0.875rem'}}>
          <p>Your Trusted Voting Platform.</p>
          <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem'}}>
            <a href="/terms" style={{color: '#059669', textDecoration: 'none', fontWeight: '500'}}>Terms of Service</a>
            <span style={{color: '#cbd5e1'}}>•</span>
            <a href="mailto:support@whitematrix.com" style={{color: '#059669', textDecoration: 'none', fontWeight: '500'}}>Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}