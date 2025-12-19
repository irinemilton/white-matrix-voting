const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('DATABASE_URL is not set. Please configure your database connection string.');
}

// Detect if the database is hosted on Render
const isRender = connectionString.includes('render.com');

const pool = new Pool({
  connectionString: connectionString || undefined,
  // Force SSL for Render, disable for local
  ssl: isRender ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};