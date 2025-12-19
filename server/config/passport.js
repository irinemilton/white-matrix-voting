const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OAuth2Strategy = require('passport-oauth2').Strategy;
const axios = require('axios'); // Add this for manual fetching
const db = require('./db');

passport.serializeUser((user, done) => {
  console.log('Serializing user:', user);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user with ID:', id);
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    console.log('Deserialization query result:', result.rows);

    if (result.rows.length === 0) {
      console.log('User not found in database for ID:', id);
      return done(null, false);
    }

    const user = result.rows[0];
    console.log('Deserialized user:', user);
    done(null, user);
  } catch (err) {
    console.error('Deserialization error:', err);
    done(err, null);
  }
});

// GOOGLE STRATEGY
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;

      console.log('Google OAuth - Profile data:', {
        id: profile.id,
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile.photos
      });

      let user = await db.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
      if (user.rows.length === 0) {
        // Check if user exists by email
        let existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
          // Update existing user with google_id
          console.log('Updating existing user with Google ID:', { googleId, existingUserId: existing.rows[0].id });
          await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, existing.rows[0].id]);
          return done(null, { ...existing.rows[0], google_id: googleId });
        } else {
          // Insert new user
          console.log('Creating new Google user:', { googleId, name, email });
          const newUser = await db.query(
            'INSERT INTO users (google_id, display_name, email) VALUES ($1, $2, $3) RETURNING *',
            [googleId, name, email]
          );
          return done(null, newUser.rows[0]);
        }
      } else {
        console.log('Found existing Google user:', user.rows[0]);
      }
      return done(null, user.rows[0]);
    } catch (err) {
      console.error('Google OAuth error:', err);
      return done(err);
    }
  }
));

// LINKEDIN STRATEGY - USING OAUTH2
passport.use('linkedin', new OAuth2Strategy({
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: `${SERVER_URL}/auth/linkedin/callback`,
    scope: ['openid', 'profile', 'email'],
    state: true
  },
  async (accessToken, refreshToken, params, profile, done) => {
    try {
      // Fetch user info from LinkedIn's OpenID Connect endpoint
      const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const userInfo = userInfoResponse.data;
      console.log('LinkedIn userinfo response:', JSON.stringify(userInfo, null, 2));

      const { sub, name, email, profile: profileUrl, website, publicProfileUrl, profile } = userInfo;

      // Try different possible field names for the profile URL
      let linkedinProfileUrl = profileUrl || profile || userInfo.profile || userInfo.publicProfileUrl || userInfo.website;

      console.log('Extracted profile URL:', linkedinProfileUrl);
      console.log('Available fields:', Object.keys(userInfo));

      // If not available in userinfo, try to construct it from the sub (LinkedIn ID)
      // Note: This is not the actual profile URL, but LinkedIn doesn't provide it in basic OAuth
      if (!linkedinProfileUrl && sub) {
        // LinkedIn profile URLs are typically https://www.linkedin.com/in/{vanity-name}
        // But we don't have the vanity name from basic OAuth, so we'll leave it null
        linkedinProfileUrl = null;
      }

      let user = await db.query('SELECT * FROM users WHERE linkedin_id = $1', [sub]);
      if (user.rows.length === 0) {
        // Check if user exists by email
        let existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
          // Update existing user with linkedin_id and profile URL
          console.log('Updating existing user with LinkedIn data:', { sub, linkedinProfileUrl });
          await db.query('UPDATE users SET linkedin_id = $1, linkedin_profile_url = $2 WHERE id = $3',
            [sub, linkedinProfileUrl, existing.rows[0].id]);
          return done(null, { ...existing.rows[0], linkedin_id: sub, linkedin_profile_url: linkedinProfileUrl });
        } else {
          // Insert new user
          console.log('Creating new LinkedIn user:', { sub, name, email, linkedinProfileUrl });
          const newUser = await db.query(
            'INSERT INTO users (linkedin_id, display_name, email, linkedin_profile_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [sub, name, email, linkedinProfileUrl]
          );
          return done(null, newUser.rows[0]);
        }
      } else {
        console.log('Found existing LinkedIn user:', user.rows[0]);
      }
      return done(null, user.rows[0]);
    } catch (err) {
      console.error("LinkedIn Profile Error:", err.response?.data || err.message);
      return done(err);
    }
  }
));

module.exports = passport;