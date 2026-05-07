// seedAdmin.js
const bcrypt = require('bcrypt');
const db = require('./models/db');
require('dotenv').config(); // Local testing ke liye zaruri hai

// Ab hum actual values ki jagah variables use kar rahe hain
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

async function createAdmin() {
  // Check karein ki variables set hain ya nahi
  if (!email || !password) {
    console.error("❌ Error: ADMIN_EMAIL ya ADMIN_PASSWORD Environment Variables mein nahi mile!");
    process.exit(1);
  }

  try {
    const hashedPwd = await bcrypt.hash(password, 10);
    
    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE password = VALUES(password)`;
                 
    db.query(sql, ['Admin', email, hashedPwd], (err, result) => {
      if (err) {
        console.error("❌ Database Error:", err);
        process.exit(1);
      }
      console.log(`✅ Admin user created/updated successfully!`);
      // Security ke liye password console mein print mat karna production par
      process.exit();
    });
  } catch (e) {
    console.error("❌ Hashing Error:", e);
    process.exit(1);
  }
}

createAdmin();