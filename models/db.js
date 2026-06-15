const mysql = require('mysql');
require('dotenv').config();

// Changed createConnection to createPool
const db = mysql.createPool(process.env.DATABASE_URL || {
    connectionLimit: 10, // Maximum number of connections in the pool
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: true }
});

// Test the pool by grabbing a single connection on startup
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error connecting to DB:', err);
        return;
    }
    console.log('✅ DB Connected Successfully (Using Pool)');
    connection.release(); // Always release the connection back to the pool
});

module.exports = db;