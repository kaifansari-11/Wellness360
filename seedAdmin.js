// seedAdmin.js
const bcrypt = require('bcrypt');
const db = require('./models/db');

const email = 'admin@wellness360.com';
const password = 'admin123';  

async function createAdmin() {
  try {
    const hashedPwd = await bcrypt.hash(password, 10);
    
    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE password = VALUES(password)`;
    db.query(sql, ['Admin', email, hashedPwd], (err, result) => {
      if (err) throw err;
      console.log(` Admin user created/updated: ${email} / ${password}`);
      process.exit();
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

createAdmin();
