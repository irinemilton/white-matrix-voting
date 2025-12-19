const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db'); 
require('./config/passport'); 

const app = express();

app.use(cors({ origin: 'http://localhost:5174', credentials: true }));
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
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// --- AUTH ROUTES ---

app.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account' // Forces account choice to prevent auto-login loops
}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5174/login' }),
  (req, res) => {
    res.redirect('http://localhost:5174/voting');
  }
);

app.get('/auth/linkedin', passport.authenticate('linkedin'));

app.get('/auth/linkedin/callback', 
  passport.authenticate('linkedin', { failureRedirect: 'http://localhost:5174/login' }),
  (req, res) => {
    res.redirect('http://localhost:5174/voting');
  }
);

// Identity check route for frontend ProtectedRoutes
app.get('/api/user', (req, res) => {
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
      SELECT users.display_name, users.linkedin_id 
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

app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('http://localhost:5174/login');
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));