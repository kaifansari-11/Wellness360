const mysql = require('mysql');
require('dotenv').config(); 

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    dateStrings: true 
});

db.connect((err) => {
    if (err) throw err;
    console.log('DB Connected (models/db.js)');
});

module.exports = db;