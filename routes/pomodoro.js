const express = require('express');
const router = express.Router();

// Pomodoro Timer Page
router.get('/pomodoro', (req, res) => {
  
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  // This simply renders the page, because the middleware in app.js
  // has already provided the 'user' and 'mood' variables.
  res.render('pomodoro');
});

module.exports = router;