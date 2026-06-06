const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function migrate() {
  try {
    console.log('🔄 Running database migration...');
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'migrations', '001_initial_schema.sql'),
      'utf-8'
    );
    await db.query(sql);
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
