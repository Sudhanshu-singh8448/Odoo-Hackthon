const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'odoo',
  user: 'postgres',
  password: 'Sudha@7250',
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
