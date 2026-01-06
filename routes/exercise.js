const express = require('express');
const router = express.Router();
const db = require('../models/db');

// ---- Mood → Exercise suggestions ----
const EXERCISES = {
  happy: { key: 'dance_cardio', title: '5-min Dance Cardio', durationMin: 5, gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWx2M2JrejM5bmI3a3BsZzB4c240cWk5cWN3NHZrM2M2ajAxMnowYyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Pyyua3fxC81C1fH3kl/giphy.gif', desc: 'Play your favorite track and do relaxed dance/marching in place.' },
  excited: { key: 'jumping_jacks', title: 'Jumping Jacks Burst', durationMin: 4, gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZnYyMXA0bzlycTltbmZnNzF5cnd2ajNqOG93NnNyNWg3azJtNW56MCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/40Ka18YWLXKW2lIpCg/giphy.gif', desc: 'Short, energetic set: 4×45s work / 15s rest.' },
  calm: { key: 'neck_back_stretch', title: 'Neck & Back Stretch', durationMin: 6, gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb3kybXR3OGdueGl4NDQ4NnhsOXR6ZWoybmJnaTNobHVucjN5c2JuYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/THNVTzCxvL45ei3Sjp/giphy.gif', desc: 'Gentle stretches: neck rolls, chest opener, cat-cow.' },
  neutral: { key: 'sun_salutation', title: 'Mini Sun Salutation', durationMin: 5, gif: 'https://c.tenor.com/8N0fKHxgvsAAAAAC/tenor.gif', desc: 'Slow flow: inhale reach, exhale fold, half lift, step back, repeat.' },
  angry: { key: 'box_breathing', title: 'Box Breathing (4-4-4-4)', durationMin: 4, gif: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', desc: 'Inhale 4s • Hold 4s • Exhale 4s • Hold 4s. Repeat calmly.' },
  anxious: { key: 'guided_breath', title: 'Guided Calm Breath', durationMin: 5, gif: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExempoMGp5dWRjczBpMmRwbTQ3MGJmdmUzMzB5bGx4OXkzZjFncXVmbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ydVuuLupD8hRrCpEs6/giphy.gif', desc: 'Slow nasal breathing with longer exhales to downshift stress.' },
  sad: { key: 'mindful_walk', title: 'Mindful 5-min Walk', durationMin: 5, gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2RrY3o2MDF6MnBobWpsZDZ4dDJ5amQwNnZqMzFrZTU4aTFsZGxkcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/E4VKK43kiegbI6QqYc/giphy.gif', desc: 'Easy pace; notice 3 sights + 3 sounds + 3 sensations.' }
};

const FALLBACK = { key: 'light_stretch', title: 'Light Full-Body Stretch', durationMin: 5, gif: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', desc: 'Gentle head-to-toe stretch. Move slowly and breathe.' };

// Helper: get latest mood from the session, fallback to DB
function getLatestMood(req, cb) {
  if (req.session.mood && req.session.mood !== 'default') {
    return cb(null, req.session.mood);
  }
  const sql = `SELECT mood FROM moods WHERE user_id=? ORDER BY created_at DESC LIMIT 1`;
  db.query(sql, [req.session.userId], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows[0]?.mood || 'neutral');
  });
}

// Helper: Day streak calculation
function computeDayStreak(rows) {
  if (!rows || rows.length === 0) return 0;
  const set = new Set(rows.map(r => new Date(r.day).toISOString().slice(0, 10)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak++;
    else break;
  }
  return streak;
}

// GET /exercise page
router.get('/exercise', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  getLatestMood(req, (err, mood) => {
    if (err) throw err;
    const m = (mood || 'neutral').toLowerCase();
    const suggestion = EXERCISES[m] || FALLBACK;

    const sql7 = `SELECT DATE(completed_at) AS day, COUNT(*) AS done FROM exercise_logs WHERE user_id=? AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) GROUP BY DATE(completed_at) ORDER BY day ASC`;
    const sql30 = `SELECT DATE(completed_at) AS day FROM exercise_logs WHERE user_id=? AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(completed_at) ORDER BY day DESC`;
    const sqlBadges = `SELECT COUNT(*) AS total FROM exercise_logs WHERE user_id=?`;

    db.query(sql7, [req.session.userId], (err2, rows7) => {
      if (err2) throw err2;
      db.query(sql30, [req.session.userId], (err3, rows30) => {
        if (err3) throw err3;
        const streak = computeDayStreak(rows30);
        db.query(sqlBadges, [req.session.userId], (err4, totalRows) => {
          if (err4) throw err4;
          const total = totalRows[0]?.total || 0;
          const badges = [];
          if (total >= 1) badges.push('🏅 First Workout');
          if (streak >= 3) badges.push('🔥 3-Day Streak');
          if (streak >= 7) badges.push('🌟 7-Day Streak');

          
          res.render('exercise', {
            latestMood: m,
            suggestion,
            last7: rows7,
            dayStreak: streak,
            totalWorkouts: total,
            badges
          });
        });
      });
    });
  });
});

// POST /exercise/complete
router.post('/exercise/complete', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

  const { exercise_key, duration_sec } = req.body || {};
  if (!exercise_key || !duration_sec) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const sql = `INSERT INTO exercise_logs (user_id, exercise_key, duration_sec, completed_at) VALUES (?, ?, ?, NOW())`;
  db.query(sql, [req.session.userId, exercise_key, parseInt(duration_sec, 10)], (err) => {
    if (err) {
      console.error("DB Insert Error:", err);
      return res.status(500).json({ error: 'Save failed' });
    }
    res.json({ ok: true });
  });
});

module.exports = router;