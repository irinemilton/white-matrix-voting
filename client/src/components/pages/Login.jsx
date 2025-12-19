import React from 'react';
import '../../App.css';

export default function Login() {
  
  // Directly triggers the Passport.js flow on your Node server
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  const handleLinkedinLogin = () => {
    window.location.href = 'http://localhost:5000/auth/linkedin';
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <h1 className="auth-title">One Vote App</h1>
          <p className="auth-subtitle">Secure Candidate Support Portal</p>
        </header>
        
        <div className="auth-button-group">
          {/* Google Auth Button */}
          <button className="btn-auth btn-google" onClick={handleGoogleLogin}>
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="auth-icon" 
            />
            <span>Continue with Google</span>
          </button>

          {/* LinkedIn Auth Button */}
          <button className="btn-auth btn-linkedin" onClick={handleLinkedinLogin}>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/174/174857.png" 
              alt="LinkedIn" 
              className="auth-icon" 
            />
            <span>Continue with LinkedIn</span>
          </button>
        </div>

        <footer className="auth-footer">
          <p>Your Trusted Voting Platform.</p>
          <div className="footer-links">
            <a href="/terms">Terms of Service</a>
            <span className="separator">•</span>
            <a href="mailto:support@whitematrix.com">Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}