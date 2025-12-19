const { Pool } = require('pg');
require('dotenv').config();

// Detect if the database is hosted on Render
const isRender = process.env.DATABASE_URL.includes('render.com');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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