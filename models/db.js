const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createPool(process.env.DATABASE_URL || {
    connectionLimit: 10, 
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: true }
});

db.getConnection((err, connection) => {
    if (err) {
        console.error(' Error connecting to DB:', err);
        return;
    }
    console.log(' DB Connected Successfully (Using Pool)');
    connection.release(); 
});

module.exports = db;