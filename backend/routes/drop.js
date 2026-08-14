require('dotenv').config();
const pool = require('./db');
pool.query('DROP TABLE IF EXISTS courses')
  .then(() => { console.log('✅ Dropped old courses table'); return pool.end(); })
  .catch((e) => { console.error('Error:', e.message); return pool.end(); });