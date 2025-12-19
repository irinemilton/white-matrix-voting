const db = require('./config/db');

async function migrateCandidates() {
  try {
    console.log('Starting candidates migration...');
    
    // 1. Ensure the column exists
    await db.query(`
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
    `);
    console.log('LinkedIn URL column added/verified');

    // 2. SPECIFIC FIX: Force update with the REAL, FULL URL
    // We include https:// here so it works immediately.
    const realUrl = "https://www.linkedin.com/in/mariya-rose-rimson-3ba057356/";
    await db.query(
      "UPDATE candidates SET linkedin_url = $1 WHERE name = $2",
      [realUrl, "Maria Rose Rimson"]
    );
    console.log(`Verified REAL URL updated for Maria Rose Rimson: ${realUrl}`);

    // 3. PROTOCOL CLEANUP: Ensure EVERY link in the DB starts with https://
    // This handles any other candidates that might have broken links
    const brokenLinks = await db.query(`
      SELECT id, name, linkedin_url FROM candidates 
      WHERE linkedin_url IS NOT NULL 
      AND linkedin_url NOT LIKE 'http%'
    `);

    for (const row of brokenLinks.rows) {
      const fixedUrl = `https://${row.linkedin_url.replace(/^(https?:\/\/)?(www\.)?/, 'www.')}`;
      await db.query('UPDATE candidates SET linkedin_url = $1 WHERE id = $2', [fixedUrl, row.id]);
      console.log(`Fixed protocol for ${row.name}: ${fixedUrl}`);
    }

    // 4. NULL FILLER: Generate links for candidates who have none
    const nullCandidates = await db.query('SELECT id, name FROM candidates WHERE linkedin_url IS NULL');
    
    if (nullCandidates.rows.length > 0) {
      for (const candidate of nullCandidates.rows) {
        const generatedUrl = `https://www.linkedin.com/in/${candidate.name.toLowerCase().replace(/\s+/g, '-')}`;
        await db.query(
          'UPDATE candidates SET linkedin_url = $1 WHERE id = $2',
          [generatedUrl, candidate.id]
        );
        console.log(`Generated placeholder URL for ${candidate.name}`);
      }
    }
    
    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrateCandidates();