const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OAuth2Strategy = require('passport-oauth2').Strategy;
const axios = require('axios'); // Add this for manual fetching
const db = require('./db');

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) { done(err, null); }
});

// GOOGLE STRATEGY
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;

      let user = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
      if (user.rows.length === 0) {
        // Check if user exists by email
        let existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
          // Update existing user with google_id
          await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, existing.rows[0].id]);
          return done(null, { ...existing.rows[0], google_id: googleId });
        } else {
          // Insert new user
          const newUser = await db.query(
            'INSERT INTO users (google_id, display_name, email) VALUES ($1, $2, $3) RETURNING *',
            [googleId, name, email]
          );
          return done(null, newUser.rows[0]);
        }
      }
      return done(null, user.rows[0]);
    } catch (err) { return done(err); }
  }
));

// LINKEDIN STRATEGY - USING OAUTH2
passport.use('linkedin', new OAuth2Strategy({
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/linkedin/callback",
    scope: ['openid', 'profile', 'email'],
    state: true
  },
  async (accessToken, refreshToken, params, profile, done) => {
    try {
      // Fetch user info from LinkedIn's OpenID Connect endpoint
      const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const { sub, name, email } = response.data;

      let user = await db.query('SELECT * FROM users WHERE linkedin_id = $1', [sub]);
      if (user.rows.length === 0) {
        // Check if user exists by email
        let existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
          // Update existing user with linkedin_id
          await db.query('UPDATE users SET linkedin_id = $1 WHERE id = $2', [sub, existing.rows[0].id]);
          return done(null, { ...existing.rows[0], linkedin_id: sub });
        } else {
          // Insert new user
          const newUser = await db.query(
            'INSERT INTO users (linkedin_id, display_name, email) VALUES ($1, $2, $3) RETURNING *',
            [sub, name, email]
          );
          return done(null, newUser.rows[0]);
        }
      }
      return done(null, user.rows[0]);
    } catch (err) {
      console.error("LinkedIn Profile Error:", err.response?.data || err.message);
      return done(err);
    }
  }
));

module.exports = passport;