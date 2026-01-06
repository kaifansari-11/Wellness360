const express = require('express');
const router = express.Router();
const db = require('../models/db');
const util = require('util');


const query = util.promisify(db.query).bind(db);

// Helper function to calculate streaks
async function getStreaks(userId) {
    
    const streakSql = `
        WITH RECURSIVE DateSeries AS (
            SELECT CURDATE() AS completion_date
            UNION ALL
            SELECT completion_date - INTERVAL 1 DAY
            FROM DateSeries
            WHERE completion_date > CURDATE() - INTERVAL 90 DAY
        ),
        RankedLogs AS (
            SELECT
                h.id AS habit_id,
                ds.completion_date,
                (CASE WHEN hl.id IS NOT NULL THEN 1 ELSE 0 END) AS is_completed,
                ROW_NUMBER() OVER (PARTITION BY h.id ORDER BY ds.completion_date DESC) as rn
            FROM habits h
            CROSS JOIN DateSeries ds
            LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ds.completion_date AND hl.status = 'done'
            WHERE h.user_id = ?
        )
        SELECT
            habit_id,
            MIN(rn) - 1 AS streak
        FROM RankedLogs
        WHERE is_completed = 0
        GROUP BY habit_id;
    `;
    const allHabitsSql = `SELECT id as habit_id, 0 as streak FROM habits WHERE user_id = ?`;

    try {
        const [streaks, allHabits] = await Promise.all([
            query(streakSql, [userId]),
            query(allHabitsSql, [userId])
        ]);

        
        const streakMap = new Map(streaks.map(s => [s.habit_id, s.streak]));
        const finalStreaks = allHabits.map(h => ({
            habit_id: h.habit_id,
            streak: streakMap.get(h.habit_id) || 0
        }));

        return finalStreaks;

    } catch (error) {
        console.error("Error calculating streaks:", error);
        return [];
    }
}


// ===== GET Habits Page (Refactored with async/await) =====
router.get('/habits', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const userId = req.session.userId;

    try {
        // 1. Fetch all data in parallel
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];

        const habitsSql = `SELECT * FROM habits WHERE user_id = ? ORDER BY id DESC`;
        const totalHabitsSql = `SELECT COUNT(*) AS total FROM habits WHERE user_id = ?`;
        const dailyDoneSql = `SELECT date AS day, COUNT(*) AS done_count FROM habit_logs WHERE user_id = ? AND status='done' AND date >= ? GROUP BY date ORDER BY date ASC`;

        const [habits, totalResult, doneData, streakData] = await Promise.all([
            query(habitsSql, [userId]),
            query(totalHabitsSql, [userId]),
            query(dailyDoneSql, [userId, sevenDaysAgoString]),
            getStreaks(userId)
        ]);

        const totalHabits = totalResult[0] ? totalResult[0].total : 0;

        // 2. Prepare graph data
        const graphData = [];
        const today = new Date();
        const todayStringForLogic = today.toISOString().split('T')[0];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            const dayData = doneData.find(row => new Date(row.day).toISOString().split('T')[0] === dateString);
            const doneCount = dayData ? dayData.done_count : 0;

            
            const dayTotal = (dateString < todayStringForLogic)
                ? Math.max(totalHabits, doneCount)
                : totalHabits;

            graphData.push({
                day: dateString,
                total: dayTotal, 
                done: doneCount
            });
        }

        // 3. Update today's graph bar with live data from the habits table
        const todayString = today.toISOString().split('T')[0];
        const todayDataIndex = graphData.findIndex(d => d.day === todayString);
        if (todayDataIndex > -1) {
            const doneTodayCount = habits.filter(h => h.status === 'done').length;
            graphData[todayDataIndex].done = doneTodayCount;
        }

        // 4. Render the page with all data
        res.render('habits', {
            user: req.session.user,
            habits: habits,
            graphData: graphData,
            streaks: streakData || []
        });

    } catch (err) {
        console.error('Error fetching habits page data:', err);
        res.status(500).send('Database error');
    }
});

// ===== GET Habit Progress Page (Refactored with async/await) =====
router.get('/habit-progress', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const userId = req.session.userId;

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0];

        const totalHabitsSql = `SELECT COUNT(*) AS total FROM habits WHERE user_id = ?`;
        const dailyDoneSql = `SELECT date AS day, COUNT(*) AS done_count FROM habit_logs WHERE user_id = ? AND status='done' AND date >= ? GROUP BY date ORDER BY date ASC`;
        const todayDoneSql = `SELECT COUNT(*) as done FROM habits WHERE user_id = ? AND status = 'done'`;

        const [totalResult, doneData, todayResult] = await Promise.all([
            query(totalHabitsSql, [userId]),
            query(dailyDoneSql, [userId, thirtyDaysAgoString]),
            query(todayDoneSql, [userId])
        ]);

        const totalHabits = totalResult[0] ? totalResult[0].total : 0;
        const todayDoneCount = todayResult[0] ? todayResult[0].done : 0;

        
        const graphData = [];
        const today = new Date();
        const todayStringForLogic = today.toISOString().split('T')[0];

        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            const dayData = doneData.find(row => new Date(row.day).toISOString().split('T')[0] === dateString);
            const doneCount = dayData ? dayData.done_count : 0;

            
            const dayTotal = (dateString < todayStringForLogic)
                ? Math.max(totalHabits, doneCount)
                : totalHabits;

            graphData.push({
                day: dateString,
                total: dayTotal, 
                done: doneCount
            });
        }

        const todayString = today.toISOString().split('T')[0];
        const todayDataIndex = graphData.findIndex(d => d.day === todayString);
        if (todayDataIndex > -1) {
            graphData[todayDataIndex].done = todayDoneCount;
        }

        res.render('habit-progress', {
            user: req.session.user,
            graphData
        });

    } catch (err) {
        console.error('Error fetching habit progress data:', err);
        res.status(500).send('Database error');
    }
});


// ===== POST Routes (Unchanged but still good practice) =====
router.post('/habits/add', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const { habit_name } = req.body;

    if (!habit_name || habit_name.trim() === '') {
        return res.redirect('/habits');
    }

    try {
        const sql = `INSERT INTO habits (user_id, habit_name, status) VALUES (?, ?, 'pending')`;
        await query(sql, [req.session.userId, habit_name.trim()]);
        res.redirect('/habits');
    } catch (err) {
        console.error('Error adding habit:', err);
        res.status(500).send('Error adding habit');
    }
});

router.post('/habits/done/:id', async (req, res) => {
    if (!req.session.userId) return res.status(401).send('Not logged in');

    const habitId = req.params.id;
    const userId = req.session.userId;
    const todayString = new Date().toISOString().split('T')[0];

    try {
        // Update the habit status and the completion date
        const updateHabitSql = `UPDATE habits SET status='done', status_date=? WHERE id=? AND user_id=?`;
        await query(updateHabitSql, [todayString, habitId, userId]);

        // Log the completion for historical tracking (for graphs and streaks)
        const logSql = `INSERT IGNORE INTO habit_logs (habit_id, user_id, date, status) VALUES (?, ?, ?, 'done')`;
        await query(logSql, [habitId, userId, todayString]);

        res.redirect('/habits');
    } catch (err) {
        console.error('Error completing habit:', err);
        res.status(500).send('Error updating habit');
    }
});

router.post('/habits/delete/:id', async (req, res) => {
    if (!req.session.userId) return res.status(401).send('Not logged in');

    const habitId = req.params.id;
    const userId = req.session.userId;

    try {
        // Use a transaction to ensure both deletions succeed or fail together
        await query('START TRANSACTION');
        const deleteLogsSql = `DELETE FROM habit_logs WHERE habit_id = ? AND user_id = ?`;
        await query(deleteLogsSql, [habitId, userId]);

        const deleteHabitSql = `DELETE FROM habits WHERE id = ? AND user_id = ?`;
        await query(deleteHabitSql, [habitId, userId]);

        await query('COMMIT');
        res.redirect('/habits');
    } catch (err) {
        await query('ROLLBACK');
        console.error('Error deleting habit:', err);
        res.status(500).send('Error deleting habit');
    }
});

module.exports = router;