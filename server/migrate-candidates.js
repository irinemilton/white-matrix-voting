const db = require('./config/db');

async function migrateCandidates() {
  try {
    console.log('Starting candidates migration...');
    
    // Add linkedin_url column if it doesn't exist
    await db.query(`
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
    `);
    
    console.log('LinkedIn URL column added/verified');
    
    // Update existing candidates with LinkedIn URLs if they don't have them
    const candidates = await db.query('SELECT id, name FROM candidates WHERE linkedin_url IS NULL');
    
    if (candidates.rows.length > 0) {
      console.log(`Found ${candidates.rows.length} candidates without LinkedIn URLs`);
      
      for (const candidate of candidates.rows) {
        // Generate a placeholder LinkedIn URL based on candidate name
        const linkedinUrl = `https://www.linkedin.com/in/${candidate.name.toLowerCase().replace(/\s+/g, '-')}`;
        await db.query(
          'UPDATE candidates SET linkedin_url = $1 WHERE id = $2',
          [linkedinUrl, candidate.id]
        );
        console.log(`Updated ${candidate.name} with LinkedIn URL: ${linkedinUrl}`);
      }
    } else {
      console.log('All candidates already have LinkedIn URLs');
    }
    
    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrateCandidates();

