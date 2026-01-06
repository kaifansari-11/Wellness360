const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');

// --- Multer Setup for File Uploads ---
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });


// --- GET My Profile Page ---
router.get('/profile', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const userId = req.session.userId;
  const moodSql = `SELECT mood, COUNT(*) as count FROM moods WHERE user_id = ? GROUP BY mood`;
  const habitSql = `SELECT COUNT(*) as total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done FROM habits WHERE user_id = ?`;
  const exerciseSql = `SELECT COUNT(*) as total FROM exercise_logs WHERE user_id = ?`;

  db.query(moodSql, [userId], (err, moodResult) => {
    if (err) throw err;
    db.query(habitSql, [userId], (err2, habitResult) => {
      if (err2) throw err2;
      db.query(exerciseSql, [userId], (err3, exerciseResult) => {
        if (err3) throw err3;

        const totalWorkouts = exerciseResult[0]?.total || 0;
        const badges = [];
        if (totalWorkouts >= 1) badges.push("🏅 First Workout");

        
        res.render('profile', {
          user: req.session.user,
          moodData: moodResult || [],
          habits: habitResult[0] || { total: 0, done: 0 },
          exercises: totalWorkouts,
          badges: badges,
        });
      });
    });
  });
});


// --- GET Edit Profile Page ---
router.get('/edit-profile', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  
  res.render('editprofile', { 
    user: req.session.user
  });
});


// --- POST Update Profile Logic ---
router.post('/edit-profile', upload.single('profile_pic'), (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { name } = req.body;
  const profilePicPath = req.file ? '/uploads/' + req.file.filename : null;
  const newName = name || req.session.user.name;

  const sql = `UPDATE users SET name=?, profile_pic=COALESCE(?, profile_pic) WHERE id=?`;
  db.query(sql, [newName, profilePicPath, req.session.userId], (err) => {
    if (err) throw err;

    
    req.session.user.name = newName;
    if (profilePicPath) {
      req.session.user.profile_pic = profilePicPath;
    }
    
    res.redirect('/profile');
  });
});

module.exports = router;