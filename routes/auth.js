const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../models/db');

// --- Signup and Login Pages ---
router.get('/signup', (req, res) => { res.render('signup'); });
router.get('/login', (req, res) => { res.render('login'); });

// --- Signup Logic ---
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(sql, [name, email, hashedPassword], (err) => {
      if (err) {
        console.error(err);
        return res.send('Signup failed. The email might already be in use.');
      }
      res.redirect('/login');
    });
  } catch (error) {
    console.error(error);
    res.send('An error occurred during signup.');
  }
});


router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.send('Invalid email or password');

    const user = results[0];
    if (user.status === "banned") return res.send("Your account is banned.");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Invalid email or password');

    const userRole = (user.email === "admin@wellness360.com") ? 'admin' : 'user';

    // This block correctly saves ALL necessary user data, including the role
    req.session.userId = user.id;
    req.session.user = { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      profile_pic: user.profile_pic,
      role: userRole 
    };
    req.session.role = userRole; 

    // Fetch initial mood and steps
    const today = new Date().toISOString().split('T')[0];
    const moodSql = 'SELECT mood FROM moods WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
    db.query(moodSql, [user.id], (moodErr, moodResults) => {
      if (moodErr) throw moodErr;
      req.session.mood = moodResults.length ? moodResults[0].mood.toLowerCase() : 'default';

      const stepsSql = 'SELECT steps FROM steps WHERE user_id = ? AND date = ?';
      db.query(stepsSql, [user.id, today], (stepsErr, stepsResults) => {
        if (stepsErr) throw stepsErr;
        req.session.todaySteps = stepsResults.length ? stepsResults[0].steps : 0;

        // Finally, redirect based on role
        if (req.session.role === 'admin') {
          return res.redirect('/admin');
        } else {
          return res.redirect('/dashboard');
        }
      });
    });
  });
});


// --- Other Routes ---
router.get('/dashboard', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  // Your dashboard logic...
  const today = new Date().toISOString().split('T')[0];
  const stepsSql = 'SELECT steps, goal FROM steps WHERE user_id = ? AND date = ?';
  db.query(stepsSql, [req.session.userId, today], (err, stepsResult) => {
      if(err) throw err;
      const todaySteps = stepsResult.length ? stepsResult[0].steps : 0;
      const goal = stepsResult.length ? stepsResult[0].goal : 10000;
      const stepPercentage = goal > 0 ? Math.min(100, Math.round((todaySteps / goal) * 100)) : 0;
      res.render('dashboard', { steps: { today: todaySteps, goal: goal, percentage: stepPercentage }});
  });
});

router.get('/mood-history', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const sql7Days = `SELECT DATE(created_at) as date, mood, COUNT(*) as count FROM moods WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(created_at), mood ORDER BY date ASC`;
    const sql30Days = `SELECT mood, COUNT(*) as count FROM moods WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY mood`;
    db.query(sql7Days, [req.session.userId], (err, results7) => {
        if (err) throw err;
        db.query(sql30Days, [req.session.userId], (err2, results30) => {
            if (err2) throw err2;
            res.render('moodhistory', { mood7Days: results7, mood30Days: results30 });
        });
    });
});
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/login');
  });
});

module.exports = router;