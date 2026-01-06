const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Show all tasks
router.get('/todo', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  const sql = 'SELECT * FROM todos WHERE user_id = ? ORDER BY status ASC, created_at DESC';
  db.query(sql, [req.session.userId], (err, tasks) => {
    if (err) throw err;

    // Calculate progress statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    
    res.render('todo', { 
      tasks: tasks,
      progress: {
        total: totalTasks,
        completed: completedTasks,
        percentage: percentage
      }
    });
  });
});

// Add a new task
router.post('/todo/add', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { task } = req.body;
  if (!task) return res.redirect('/todo');
  
  const sql = 'INSERT INTO todos (user_id, task) VALUES (?, ?)';
  db.query(sql, [req.session.userId, task], (err, result) => {
    if (err) throw err;
    res.redirect('/todo');
  });
});

// Toggle task status (pending/completed)
router.post('/todo/toggle/:id', (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const taskId = req.params.id;

    const findSql = 'SELECT status FROM todos WHERE id = ? AND user_id = ?';
    db.query(findSql, [taskId, req.session.userId], (err, results) => {
        if (err || results.length === 0) return res.redirect('/todo');

        const newStatus = results[0].status === 'pending' ? 'completed' : 'pending';
        const updateSql = 'UPDATE todos SET status = ? WHERE id = ?';
        db.query(updateSql, [newStatus, taskId], (err2, result) => {
            if (err2) throw err2;
            res.redirect('/todo');
        });
    });
});

// Delete task
router.post('/todo/delete/:id', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const taskId = req.params.id;
  
  const sql = 'DELETE FROM todos WHERE id = ? AND user_id = ?';
  db.query(sql, [taskId, req.session.userId], (err, result) => {
    if (err) throw err;
    res.redirect('/todo');
  });
});

module.exports = router;