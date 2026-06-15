// Load environment variables first
require('dotenv').config();

const bcrypt = require('bcrypt');
const db = require('./models/db');

// Pull credentials securely from the .env file
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

// Safety check
if (!email || !password) {
  console.error("❌ ERROR: ADMIN_EMAIL or ADMIN_PASSWORD is not set in your .env file.");
  process.exit(1);
}

async function createAdmin() {
  try {
    const hashedPwd = await bcrypt.hash(password, 10);
    
    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE password = VALUES(password)`;
                 
    db.query(sql, ['Admin', email, hashedPwd], (err, result) => {
      if (err) throw err;
      console.log(`✅ Admin user created/updated successfully for: ${email}`);
      process.exit();
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

createAdmin();