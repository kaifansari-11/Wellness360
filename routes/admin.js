const express = require("express");
const router = express.Router();
const db = require("../models/db");

const ADMIN_EMAIL = "admin@wellness360.com";


function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.redirect("/");
  }
}


router.get("/admin", isAdmin, (req, res) => {
  const search = req.query.search || "";
  const searchQuery = `%${search}%`;

  const sqlUsers = `SELECT id, name, email, DATE_FORMAT(created_at, '%Y-%m-%d') AS signup_date, status FROM users WHERE email != ? AND (name LIKE ? OR email LIKE ?)`;
  const sqlStats = `SELECT (SELECT COUNT(*) FROM users WHERE email != '${ADMIN_EMAIL}') AS total_users, (SELECT COUNT(*) FROM moods) AS total_moods, (SELECT COUNT(*) FROM habits WHERE status='done') AS total_habits_done, (SELECT COUNT(*) FROM exercise_logs) AS total_exercises`;

  db.query(sqlUsers, [ADMIN_EMAIL, searchQuery, searchQuery], (err, users) => {
    if (err) throw err;
    db.query(sqlStats, (err2, stats) => {
      if (err2) throw err2;

      res.render("admin", {
        user: req.session.user,
        stats: stats[0] || {},
        users: users || [],
        search: search,
      });
    });
  });
});


router.get('/admin/quotes', isAdmin, (req, res) => {
  const sql = `SELECT * FROM motivational_quotes ORDER BY id DESC`;
  db.query(sql, (err, quotes) => {
    if (err) throw err;
    res.render('admin-quotes', {
      user: req.session.user,
      quotes: quotes || []
    });
  });
});


// --- User Management POST Routes ---

router.post("/admin/delete/:id", isAdmin, (req, res) => {
  db.query("DELETE FROM users WHERE id=? AND email != ?", [req.params.id, ADMIN_EMAIL], (err) => {
    if (err) throw err;
    res.redirect("/admin");
  });
});

router.post("/admin/toggle-ban/:id", isAdmin, (req, res) => {
  db.query("SELECT status FROM users WHERE id=?", [req.params.id], (err, rows) => {
    if (err) throw err;
    if (rows.length > 0) {
      const newStatus = rows[0].status === "banned" ? "active" : "banned";
      db.query("UPDATE users SET status=? WHERE id=?", [newStatus, req.params.id], (err2) => {
        if (err2) throw err2;
        res.redirect("/admin");
      });
    } else {
      res.redirect("/admin");
    }
  });
});


// --- Quote Management POST Routes ---

router.post("/admin/add-quote", isAdmin, (req, res) => {
  const { quote, mood, category } = req.body;
  if (!quote || !mood || !category) return res.redirect("/admin/quotes");

  db.query(
    "INSERT INTO motivational_quotes (quote, mood, category) VALUES (?, ?, ?)",
    [quote, mood, category],
    (err) => {
      if (err) throw err;
      res.redirect("/admin/quotes");
    }
  );
});

router.post("/admin/edit-quote/:id", isAdmin, (req, res) => {
  const { new_quote } = req.body;
  if (!new_quote) return res.redirect("/admin/quotes");
  db.query("UPDATE motivational_quotes SET quote=? WHERE id=?", [new_quote, req.params.id], (err) => {
    if (err) throw err;
    res.redirect("/admin/quotes");
  });
});

router.post("/admin/delete-quote/:id", isAdmin, (req, res) => {
  db.query("DELETE FROM motivational_quotes WHERE id=?", [req.params.id], (err) => {
    if (err) throw err;
    res.redirect("/admin/quotes");
  });
});

module.exports = router;