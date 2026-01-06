const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Route: GET /mood-chart
router.get('/mood-chart', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const sql = `SELECT mood, COUNT(*) AS count FROM moods WHERE user_id = ? GROUP BY mood`;
  db.query(sql, [req.session.userId], (err, results) => {
    if (err) throw err;

    res.render('moodchart', {
      user: req.session.user, 
      moodData: results || []
    });
  });
});

// Route: GET /mood-history
router.get('/mood-history', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const sql7Days = `
    SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date, mood, COUNT(*) AS count
    FROM moods
    WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at), mood
    ORDER BY date ASC
  `;
  const sql30Days = `SELECT mood, COUNT(*) as count FROM moods WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY mood`;

  db.query(sql7Days, [req.session.userId], (err, results7) => {
    if (err) throw err;
    db.query(sql30Days, [req.session.userId], (err2, results30) => {
      if (err2) throw err2;
      
      res.render('moodhistory', {
        user: req.session.user, 
        mood7Days: results7 || [],
        mood30Days: results30 || []
      });
    });
  });
});

module.exports = router;