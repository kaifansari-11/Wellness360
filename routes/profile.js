const express = require('express');
const router = express.Router();
const db = require('../models/db');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// --- Configure Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// We use memory storage to hold the file temporarily before sending to Cloudinary
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });

// --- Helper: Stream Buffer to Cloudinary ---
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const cld_upload_stream = cloudinary.uploader.upload_stream(
      { folder: "wellness360_profiles" }, // Cloudinary folder name
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    // Convert the memory buffer into a readable stream and pipe it
    Readable.from(buffer).pipe(cld_upload_stream);
  });
};

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
router.post('/edit-profile', upload.single('profile_pic'), async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const { name } = req.body;
  const newName = name || req.session.user.name;
  
  // Default to the user's existing profile picture
  let profilePicPath = req.session.user.profile_pic || null; 

  try {
    // If the user uploaded a new file, push it to Cloudinary
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      profilePicPath = uploadResult.secure_url; 
    }

    // Save the new details to the database
    const sql = `UPDATE users SET name=?, profile_pic=COALESCE(?, profile_pic) WHERE id=?`;
    db.query(sql, [newName, profilePicPath, req.session.userId], (err) => {
      if (err) throw err;
      
      // Update session variables so the UI reflects changes immediately
      req.session.user.name = newName;
      if (profilePicPath) {
        req.session.user.profile_pic = profilePicPath;
      }
      
      req.session.save((saveErr) => {
        if (saveErr) console.error("Session save error:", saveErr);
        res.redirect('/profile');
      });
    });

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    res.status(500).send("An error occurred while uploading your profile picture.");
  }
});

module.exports = router;