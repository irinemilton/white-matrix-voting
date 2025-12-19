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

// 1. TRUST PROXY (Crucial for Render/HTTPS cookies)
app.set('trust proxy', 1);

// 2. REFACTORED CORS (Must allow credentials and specific origin)
app.use(cors({ 
    origin: CLIENT_ORIGIN, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 3. REFACTORED SESSION CONFIG (Optimized for Production on Render)
app.use(session({
    name: 'voting_app_session', // Changed name to avoid browser conflicts
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: true,               
    saveUninitialized: false,   // Better for session security
    proxy: true,                // Tells express-session to trust the reverse proxy
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // true for HTTPS on Render
        httpOnly: true,
        // 'none' is required because frontend and backend are on different domains
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// --- STATUS & HEALTH ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/test-linkedin-verify', async (req, res) => {
    const { linkedinUrl } = req.body;
    if (!linkedinUrl) return res.status(400).json({ error: 'LinkedIn URL required' });
    const result = await verifyLinkedInUrl(linkedinUrl);
    res.json(result);
});

// --- AUTH ROUTES ---
app.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' 
}));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: CLIENT_ORIGIN + '/login' }),
    (req, res) => {
        const isGoogleUser = req.user.google_id && !req.user.linkedin_id;
        const hasLinkedInUrl = req.user.linkedin_profile_url;

        if (isGoogleUser && !hasLinkedInUrl) {
            res.redirect(CLIENT_ORIGIN + '/profile-completion');
        } else {
            res.redirect(CLIENT_ORIGIN + '/voting');
        }
    }
);

app.get('/auth/linkedin', passport.authenticate('linkedin'));

app.get('/auth/linkedin/callback', 
    passport.authenticate('linkedin', { failureRedirect: CLIENT_ORIGIN + '/login' }),
    (req, res) => {
        if (!req.user.linkedin_profile_url) {
            res.redirect(CLIENT_ORIGIN + '/profile-completion');
        } else {
            res.redirect(CLIENT_ORIGIN + '/voting');
        }
    }
);

// --- USER & DATA ROUTES ---
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ authenticated: true, user: req.user });
    } else {
        res.json({ authenticated: false });
    }
});

app.get('/api/candidates', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM candidates LIMIT 2');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Database error' }); }
});

app.post('/api/vote', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Please log in' });

    try {
        const { candidateId } = req.body;
        await db.query('INSERT INTO votes (user_id, candidate_id) VALUES ($1, $2)', [req.user.id, candidateId]);
        res.json({ message: 'Support recorded!' });
    } catch (err) {
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

// --- PROFILE UPDATE LOGIC ---
app.post('/api/update-linkedin-url', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Please log in' });
  }

  try {
    const { linkedinUrl } = req.body;

    // Call the refactored verifier
    const verification = await verifyLinkedInUrl(linkedinUrl);
    
    if (!verification.isValid) {
      return res.status(400).json({ error: verification.error });
    }

    // Use the sanitized URL (cleanUrl) returned by the verifier
    const finalUrl = verification.url; 

    console.log('Updating database for user:', req.user.id, 'with URL:', finalUrl);

    // Update the database
    await db.query(
      'UPDATE users SET linkedin_profile_url = $1 WHERE id = $2',
      [finalUrl, req.user.id]
    );

    // Refresh user data in current session
    const updatedUserResult = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const updatedUser = updatedUserResult.rows[0];
    
    Object.assign(req.user, updatedUser);
    
    req.login(updatedUser, (err) => {
      if (err) return res.status(500).json({ error: 'Session refresh failed' });
      req.session.save(() => res.json({ message: 'Profile updated successfully', user: updatedUser }));
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
            res.clearCookie('voting_app_session');
            res.redirect(CLIENT_ORIGIN + '/login');
        });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));