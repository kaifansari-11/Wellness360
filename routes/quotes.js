const express = require('express');
const router = express.Router();
const db = require('../models/db');


router.get('/daily-quote', (req, res) => {
  const mood = req.query.mood || null;
  const category = req.query.category || null;

  let sql = "SELECT * FROM motivational_quotes";
  const params = [];

  // Build the specific query if mood or category is provided
  if (mood || category) {
    sql += " WHERE";
    if (mood) {
      sql += " mood = ?";
      params.push(mood);
    }
    if (category) {
      if (mood) sql += " AND";
      sql += " category = ?";
      params.push(category);
    }
  }

  sql += " ORDER BY RAND() LIMIT 1";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Quote DB Error:", err);
      return res.status(500).json({ quote: "Database error!" });
    }

    // If a specific quote is found, return it
    if (results.length > 0) {
      return res.json({ quote: results[0].quote });
    } 
    
    
    else {
      db.query("SELECT * FROM motivational_quotes ORDER BY RAND() LIMIT 1", (err2, fallbackResults) => {
        if (err2 || fallbackResults.length === 0) {
          return res.json({ quote: "Start your day with a positive thought!" });
        }
        return res.json({ quote: fallbackResults[0].quote });
      });
    }
  });
});

module.exports = router;