// testdb.js — quick PostgreSQL connectivity check
require('dotenv').config();
const pool = require('./db');

(async () => {
  try {
    const info = await pool.query(
      'SELECT NOW() AS server_time, current_database() AS db, current_user AS usr'
    );
    console.log('✅ Connected to PostgreSQL');
    console.log('   Database   :', info.rows[0].db);
    console.log('   User       :', info.rows[0].usr);
    console.log('   Server time:', info.rows[0].server_time);

    try {
      const users = await pool.query('SELECT COUNT(*) AS count FROM users');
      console.log('   users table:', users.rows[0].count, 'row(s)');
    } catch (e) {
      console.log('   ⚠  Could not read the "users" table:', e.message);
    }
  } catch (err) {
    console.error('❌ Could NOT connect to PostgreSQL');
    console.error('   Reason:', err.message);
  } finally {
    await pool.end();
  }
})();