const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
});

pool.query(
  `CREATE TABLE IF NOT EXISTS riddz_scores (
    user_id TEXT PRIMARY KEY,
    score INTEGER
    );
  CREATE TABLE IF NOT EXISTS user_wallets (
      user_id TEXT PRIMARY KEY,
      wallet_address TEXT
  )`,
  
  (err, res) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Table created successfully');
    }
  }
);

module.exports = {
  db: pool,
};