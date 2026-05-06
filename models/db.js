const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection(process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: true } // Cloud DBs usually require SSL
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to DB:', err);
        return;
    }
    console.log('✅ DB Connected Successfully');
});

module.exports = db;