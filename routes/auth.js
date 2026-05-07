const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../models/db');

// --- Pages ---
router.get('/signup', (req, res) => { res.render('signup'); });
router.get('/login', (req, res) => { res.render('login'); });

// --- Login Logic ---
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

        // ✅ DB se role lo, agar null hai toh 'user' assign karo
        const userRole = user.role || 'user';

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

                // ✅ Final Redirect based on DB Role
                if (req.session.role === 'admin') {
                    res.redirect('/admin'); 
                } else {
                    res.redirect('/dashboard');
                }
            });
        });
    });
});

// --- Logout ---
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/login');
    });
});

module.exports = router;