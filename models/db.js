const mysql = require('mysql2'); // mysql2 use karna behtar hai
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false // Cloud database ke liye ye line add karein
    }
});

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err.message);
        return;
    }
    console.log('Connected to Aiven Cloud Database!');
});

module.exports = db;