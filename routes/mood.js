const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET Mood Tracker Page
router.get('/mood', (req, res) => {
  // Security check to ensure the user is logged in
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  // This query gets the mood history for the bar chart
  const sql = `
    SELECT mood, COUNT(*) as count 
    FROM moods 
    WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY mood
  `;

  db.query(sql, [req.session.userId], (err, moodData) => {
    if (err) throw err;

  
    res.render('mood', { 
      user: req.session.user, 
      moodData: moodData || [] 
    });
  });
});

// POST Save Mood
router.post('/mood', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }

  const { mood } = req.body;
  const userId = req.session.userId;

  if (!mood) {
    return res.redirect('/mood');
  }

  const sql = 'INSERT INTO moods (user_id, mood) VALUES (?, ?)';
  db.query(sql, [userId, mood], (err, result) => {
    if (err) throw err;
    
    // This updates the session so the theme changes immediately
    req.session.mood = mood.toLowerCase();

    // This redirects to the dashboard and triggers the "For Your Mood" pop-up
    res.redirect(`/dashboard?mood_logged=${mood.toLowerCase()}`);
  });
});

module.exports = router;