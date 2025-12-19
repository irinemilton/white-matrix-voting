const db = require('./config/db');

async function setupDatabase() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE,
        linkedin_id VARCHAR(255) UNIQUE,
        display_name VARCHAR(255),
        email VARCHAR(255),
        linkedin_profile_url VARCHAR(255)
      );
    `);

    // Add linkedin_profile_url column if it doesn't exist
    await db.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_profile_url VARCHAR(255);
    `);

    // Drop unique constraint on email if it exists
    await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;`);

    // Create candidates table
    await db.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        linkedin_url VARCHAR(255)
      );
    `);

    // Add linkedin_url column if it doesn't exist
    await db.query(`
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
    `);

    // Create votes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        candidate_id INTEGER REFERENCES candidates(id),
        UNIQUE(user_id)
      );
    `);

    // Insert sample candidates if not exist
    const candidates = await db.query('SELECT COUNT(*) FROM candidates');
    if (parseInt(candidates.rows[0].count) === 0) {
      await db.query(`INSERT INTO candidates (name, description, linkedin_url) 
        VALUES ('Candidate A', 'Experienced leader with a vision for innovation and growth.', 'https://www.linkedin.com/in/candidate-a')`);
      await db.query(`INSERT INTO candidates (name, description, linkedin_url) 
        VALUES ('Candidate B', 'Dedicated professional committed to excellence and community impact.', 'https://www.linkedin.com/in/candidate-b')`);
    }

    console.log('Database setup complete');
  } catch (err) {
    console.error('Database setup error:', err);
  }
}

setupDatabase();