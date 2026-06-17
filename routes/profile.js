const express = require('express');
const router = express.Router();
const db = require('../models/db');
const multer = require('multer');

// --- Multer Setup for File Uploads (Vercel-Safe) ---
// We use memory storage because Vercel's filesystem is read-only.
const storage = multer.memoryStorage(); 
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
  const newName = name || req.session.user.name;

  // ⚠️ TEMPORARY VERCEL FIX: We are ignoring the file upload for now 
  // because local disk storage does not work on Vercel. 
  // In the future, you will integrate Cloudinary or AWS S3 here.
  const profilePicPath = null; 

  const sql = `UPDATE users SET name=?, profile_pic=COALESCE(?, profile_pic) WHERE id=?`;
  db.query(sql, [newName, profilePicPath, req.session.userId], (err) => {
    if (err) throw err;
    
    req.session.user.name = newName;
    // req.session.user.profile_pic = profilePicPath; // Skipped for now
    
    res.redirect('/profile');
  });
});

module.exports = router;