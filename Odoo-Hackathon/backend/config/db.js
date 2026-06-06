const { Pool } = require('pg');

require('dotenv').config();

const useSsl = process.env.DB_SSL === 'true';

const pool = new Pool(process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ...(useSsl && { ssl: { rejectUnauthorized: false } }),
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'odoo',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ...(useSsl && { ssl: { rejectUnauthorized: false } }),
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
  withTransaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
