const express = require('express');
const router = express.Router();

// Pomodoro Timer Page
router.get('/pomodoro', (req, res) => {
  
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.render('pomodoro');
});

module.exports = router;