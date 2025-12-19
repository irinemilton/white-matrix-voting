const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db'); 
require('./config/passport');
const { verifyLinkedInUrl } = require('./utils/linkedinVerifier'); 

const app = express();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5174';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// REFACTORED SESSION CONFIG
app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: true,          // MUST be true to persist session correctly
  saveUninitialized: true, 
  cookie: { 
    secure: false,       // MUST be false for local HTTP
    httpOnly: true,
    sameSite: 'lax',     // Crucial for redirects from Google/LinkedIn
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',           // Ensure cookie is available for all paths
    // Don't set domain for localhost - let browser handle it
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test LinkedIn URL verification endpoint (for debugging)
app.post('/api/test-linkedin-verify', async (req, res) => {
  const { linkedinUrl } = req.body;
  if (!linkedinUrl) {
    return res.status(400).json({ error: 'LinkedIn URL required' });
  }
  
  const { verifyLinkedInUrl } = require('./utils/linkedinVerifier');
  const result = await verifyLinkedInUrl(linkedinUrl);
  res.json(result);
});

// --- AUTH ROUTES ---

app.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account' // Forces account choice to prevent auto-login loops
}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: CLIENT_ORIGIN + '/login' }),
  (req, res) => {
    console.log('Google login successful');
    console.log('User after Google login:', req.user);
    // Check if Google user needs profile completion
    const isGoogleUser = req.user.google_id && !req.user.linkedin_id;
    const hasLinkedInUrl = req.user.linkedin_profile_url;

    if (isGoogleUser && !hasLinkedInUrl) {
      // Redirect to profile completion for Google users without LinkedIn URL
      console.log('Redirecting Google user to profile completion');
      res.redirect(CLIENT_ORIGIN + '/profile-completion');
    } else {
      // User has complete profile, redirect to voting
      console.log('Google user has complete profile, redirecting to voting');
      res.redirect(CLIENT_ORIGIN + '/voting');
    }
  }
);

app.get('/auth/linkedin', passport.authenticate('linkedin'));

app.get('/auth/linkedin/callback', 
  passport.authenticate('linkedin', { failureRedirect: CLIENT_ORIGIN + '/login' }),
  (req, res) => {
    console.log('LinkedIn login successful');
    console.log('User after LinkedIn login:', req.user);

    // Check if LinkedIn user has a profile URL
    const hasLinkedInUrl = req.user.linkedin_profile_url;

    if (!hasLinkedInUrl) {
      // Redirect to profile completion for LinkedIn users without profile URL
      console.log('Redirecting LinkedIn user to profile completion - no profile URL found');
      res.redirect(CLIENT_ORIGIN + '/profile-completion');
    } else {
      // User has complete profile, redirect to voting
      console.log('LinkedIn user has profile URL, redirecting to voting');
      res.redirect(CLIENT_ORIGIN + '/voting');
    }
  }
);

// Identity check route for frontend ProtectedRoutes
app.get('/api/user', (req, res) => {
  console.log('User check - Authenticated:', req.isAuthenticated());
  console.log('User data:', req.user);
  console.log('Session ID:', req.sessionID);
  console.log('Cookies:', req.headers.cookie);

  // Set CORS headers explicitly
  res.header('Access-Control-Allow-Origin', CLIENT_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Voter API Routes
app.get('/api/candidates', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM candidates LIMIT 2');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/vote', async (req, res) => {
  console.log('Vote attempt - Authenticated:', req.isAuthenticated());
  console.log('User:', req.user);

  if (!req.isAuthenticated()) {
    console.log('Vote rejected: Not authenticated');
    return res.status(401).json({ error: 'Please log in' });
  }

  try {
    const { candidateId } = req.body;
    console.log('Recording vote for user:', req.user.id, 'candidate:', candidateId);

    await db.query('INSERT INTO votes (user_id, candidate_id) VALUES ($1, $2)', [req.user.id, candidateId]);
    console.log('Vote recorded successfully');

    res.json({ message: 'Support recorded!' });
  } catch (err) {
    console.error('Vote error:', err);
    if (err.code === '23505') return res.status(400).json({ error: 'Already voted' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/voters', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT users.display_name, users.linkedin_profile_url, users.google_id, users.linkedin_id
      FROM users 
      JOIN votes ON users.id = votes.user_id
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Could not fetch voters' }); }
});

app.get('/api/results', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT candidates.name, COUNT(votes.id) as votes
      FROM candidates
      LEFT JOIN votes ON candidates.id = votes.candidate_id
      GROUP BY candidates.id, candidates.name
      ORDER BY votes DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Could not fetch results' }); }
});

// Update LinkedIn profile URL for authenticated users
app.post('/api/update-linkedin-url', async (req, res) => {
  console.log('Update LinkedIn URL attempt - Authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  console.log('Session ID:', req.sessionID);

  if (!req.isAuthenticated()) {
    console.log('Update rejected: Not authenticated');
    return res.status(401).json({ error: 'Please log in' });
  }

  try {
    const { linkedinUrl } = req.body;

    if (!linkedinUrl || !linkedinUrl.trim()) {
      return res.status(400).json({ error: 'LinkedIn URL is required' });
    }

    // Basic LinkedIn URL format validation
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?(\?.*)?$/;
    if (!linkedinRegex.test(linkedinUrl.trim())) {
      return res.status(400).json({ error: 'Please enter a valid LinkedIn profile URL format (e.g., https://linkedin.com/in/username)' });
    }

    // Verify the LinkedIn URL actually exists and is accessible
    console.log('Verifying LinkedIn URL:', linkedinUrl.trim());
    const verification = await verifyLinkedInUrl(linkedinUrl.trim());
    
    if (!verification.isValid) {
      console.log('LinkedIn URL verification failed:', verification.error);
      return res.status(400).json({ error: verification.error || 'LinkedIn profile URL could not be verified. Please check the URL and try again.' });
    }

    console.log('LinkedIn URL verified successfully. Updating for user:', req.user.id, 'to:', linkedinUrl.trim());

    // Update the user's LinkedIn profile URL in the database
    await db.query(
      'UPDATE users SET linkedin_profile_url = $1 WHERE id = $2',
      [linkedinUrl.trim(), req.user.id]
    );

    console.log('LinkedIn URL updated in database');

    // Refresh user data from database to ensure we have the latest
    const updatedUserResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (updatedUserResult.rows.length === 0) {
      return res.status(500).json({ error: 'User not found after update' });
    }

    const updatedUser = updatedUserResult.rows[0];
    console.log('Updated user from DB:', updatedUser);
    
    // Update req.user with fresh data from database
    Object.assign(req.user, updatedUser);
    
    // Force Passport to update the session with the new user data
    // Wrap in Promise to handle async properly
    await new Promise((resolve, reject) => {
      req.login(updatedUser, (err) => {
        if (err) {
          console.error('Error updating session:', err);
          return reject(err);
        }
        console.log('Session refreshed successfully. User LinkedIn URL:', updatedUser.linkedin_profile_url);
        resolve();
      });
    });

    // Save session explicitly to ensure it's persisted
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      console.log('Session saved. Ready to respond.');
      res.json({ message: 'Profile updated successfully', user: updatedUser });
    });
  } catch (err) {
    console.error('Update LinkedIn URL error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect(CLIENT_ORIGIN + '/login');
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));