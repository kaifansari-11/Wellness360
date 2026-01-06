const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET Steps Page
router.get('/steps', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const userId = req.session.userId;
  const today = new Date().toISOString().split('T')[0];

  const dailySql = `SELECT steps, goal FROM steps WHERE user_id=? AND date=?`;
  const weeklySql = `SELECT date, steps, goal FROM steps WHERE user_id=? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ORDER BY date ASC`;
  const bestDaySql = `SELECT date, steps FROM steps WHERE user_id=? ORDER BY steps DESC LIMIT 1`;

  db.query(dailySql, [userId, today], (err, dailyResult) => {
    if (err) throw err;
    db.query(weeklySql, [userId], (err2, weeklyResult) => {
      if (err2) throw err2;
      db.query(bestDaySql, [userId], (err3, bestDayResult) => {
        if (err3) throw err3;

        let todaySteps = dailyResult.length ? dailyResult[0].steps : 0;
        let goal = dailyResult.length ? dailyResult[0].goal : 10000;
        let bestDay = bestDayResult.length ? bestDayResult[0] : null;

        let goalAchieved = todaySteps >= goal;
        let badges = [];
        if (goalAchieved) badges.push("🏆 Goal Achieved!");
        if (weeklyResult.filter(d => d.steps >= d.goal).length >= 3) badges.push("🔥 3-Day Streak!");

        res.render('steps', {
          todaySteps,
          goal,
          weeklyData: weeklyResult,
          bestDay,
          badges,
        });
      });
    });
  });
});

// POST Add Steps / Update Goal
router.post('/steps/add', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const userId = req.session.userId;
  // Use Number() to handle empty strings as 0, which means only the goal will be updated
  const stepsToAdd = Number(req.body.steps) || 0; 
  const newGoal = Number(req.body.goal) || 10000;
  const today = new Date().toISOString().split('T')[0];

  // This query now correctly ADDS steps and SETS the new goal
  const sql = `
    INSERT INTO steps (user_id, date, steps, goal)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE steps = steps + VALUES(steps), goal = VALUES(goal)`;

  db.query(sql, [userId, today, stepsToAdd, newGoal, stepsToAdd, newGoal], (err) => {
    if (err) throw err;
    
    // After updating, get the new total to update the session correctly
    const getTotalSql = `SELECT steps FROM steps WHERE user_id = ? AND date = ?`;
    db.query(getTotalSql, [userId, today], (err2, results) => {
      if(err2) throw err2;
      
      req.session.todaySteps = results[0] ? results[0].steps : 0;
      
      
      const referrer = req.header('Referer') || '/dashboard';
      if (referrer.includes('/steps')) {
        res.redirect('/steps');
      } else {
        res.redirect('/dashboard');
      }
    });
  });
});

module.exports = router;
