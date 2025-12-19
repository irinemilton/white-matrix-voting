import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/pages/Login';
import Voting from './components/pages/Voting';
import Results from './components/pages/Results';
import ProfileCompletion from './components/pages/ProfileCompletion';
import { API_BASE_URL } from './config';

/**
 * ProtectedRoute Component
 * Checks authentication and profile completion via API call
 */
const ProtectedRoute = ({ children, requireCompleteProfile = true }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [hasCompleteProfile, setHasCompleteProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth check timed out after 10 seconds');
        setIsAuthenticated(false);
        setHasCompleteProfile(false);
      }
    }, 10000); // 10 second timeout

    const checkAuth = async (retryDelay = 0) => {
      // Add delay for retries to allow session to update
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      try {
        console.log(`[ProtectedRoute] Checking authentication (attempt ${retryCount + 1}/${maxRetries + 1}) at:`, `${API_BASE_URL}/api/user`);
        
        const response = await fetch(`${API_BASE_URL}/api/user`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-cache' // Prevent caching
        });
        
        console.log(`[ProtectedRoute] Response status:`, response.status, response.statusText);
        
        if (!response.ok) {
          console.error('[ProtectedRoute] Auth check failed with status:', response.status, response.statusText);
          if (retryCount < maxRetries && isMounted) {
            retryCount++;
            console.log(`[ProtectedRoute] Retrying in 500ms...`);
            return checkAuth(500);
          }
          if (isMounted) {
            setIsAuthenticated(false);
            setHasCompleteProfile(false);
          }
          clearTimeout(timeoutId);
          return;
        }
        
        const data = await response.json();
        console.log('[ProtectedRoute] Auth check response:', JSON.stringify(data, null, 2));
        
        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        setIsAuthenticated(data.authenticated);

        if (data.authenticated && data.user) {
          // Check if user has LinkedIn profile URL
          const hasLinkedInUrl = data.user.linkedin_profile_url && data.user.linkedin_profile_url.trim();
          console.log('[ProtectedRoute] User profile check:', {
            hasLinkedInUrl,
            linkedin_profile_url: data.user.linkedin_profile_url,
            requireCompleteProfile,
            user: data.user
          });
          
          // If profile incomplete and we're requiring it, retry once more in case session is updating
          if (requireCompleteProfile && !hasLinkedInUrl && retryCount < maxRetries) {
            retryCount++;
            console.log(`[ProtectedRoute] Profile incomplete, retrying in 500ms to check for update...`);
            return checkAuth(500);
          }
          
          setHasCompleteProfile(hasLinkedInUrl);
        } else {
          console.log('[ProtectedRoute] User not authenticated or no user data');
          setHasCompleteProfile(false);
        }
      } catch (err) {
        console.error('[ProtectedRoute] Auth check error:', err);
        if (retryCount < maxRetries && isMounted) {
          retryCount++;
          console.log(`[ProtectedRoute] Network error, retrying in 500ms...`);
          return checkAuth(500);
        }
        clearTimeout(timeoutId);
        if (isMounted) {
          setIsAuthenticated(false);
          setHasCompleteProfile(false);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [requireCompleteProfile]);

  if (isAuthenticated === null || (requireCompleteProfile && hasCompleteProfile === null)) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireCompleteProfile && !hasCompleteProfile) {
    return <Navigate to="/profile-completion" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes - Only accessible if logged in */}
        <Route 
          path="/profile-completion" 
          element={
            <ProtectedRoute requireCompleteProfile={false}>
              <ProfileCompletion />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/voting" 
          element={
            <ProtectedRoute>
              <Voting />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/results" 
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          } 
        />

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;