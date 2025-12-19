import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';
import { API_BASE_URL } from '../../config';

export default function ProfileCompletion() {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userType, setUserType] = useState('Google'); // Default to Google
  const navigate = useNavigate();

  // Check user type on component mount
  useEffect(() => {
    const checkUserType = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUserType(data.user.google_id ? 'Google' : 'LinkedIn');
        }
      } catch (err) {
        console.error('Error checking user type:', err);
      }
    };
    checkUserType();
  }, []);

  // Validate LinkedIn URL
  const validateLinkedInUrl = (url) => {
    if (!url.trim()) {
      return 'LinkedIn Profile URL is required';
    }

    // More flexible LinkedIn URL regex
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?(\?.*)?$/;
    if (!linkedinRegex.test(url)) {
      return 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateLinkedInUrl(linkedinUrl);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/update-linkedin-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ linkedinUrl: linkedinUrl.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - wait a moment for session to update, then redirect
        console.log('Profile updated successfully, redirecting...');
        console.log('Updated user data:', data.user);
        // Longer delay to ensure session is fully updated and saved on server
        // Then reload to ensure fresh session data
        setTimeout(() => {
          // Force a full page reload to ensure session is fresh
          window.location.href = '/voting';
        }, 300);
      } else {
        setError(data.error || 'Failed to update profile');
        setIsVerifying(false);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setIsVerifying(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div className="section" style={{maxWidth: '500px', width: '100%'}}>
        <div className="section-header" style={{textAlign: 'center'}}>
          <h1 className="section-title">Complete Your Profile</h1>
          <p className="section-subtitle">
            {userType === 'Google'
              ? 'Please provide your LinkedIn profile URL to continue'
              : 'Please verify your LinkedIn profile URL to continue'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '1.5rem'}}>
            <label htmlFor="linkedinUrl" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              LinkedIn Profile URL *
            </label>
            <input
              type="url"
              id="linkedinUrl"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              required
            />
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '0.25rem'
            }}>
              Example: https://linkedin.com/in/john-doe
            </p>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.375rem',
              color: '#dc2626',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{width: '100%'}}
            disabled={isSubmitting || isVerifying}
          >
            {isVerifying ? 'Verifying LinkedIn Profile...' : isSubmitting ? 'Updating Profile...' : 'Complete Profile & Continue'}
          </button>
        </form>

        <div style={{textAlign: 'center', marginTop: '1.5rem'}}>
          <p style={{fontSize: '0.875rem', color: '#6b7280'}}>
            {userType === 'Google'
              ? 'This information helps us provide better voter transparency.'
              : 'Please verify your LinkedIn profile URL for accurate voter registry display.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}