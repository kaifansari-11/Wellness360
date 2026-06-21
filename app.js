// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express');
const session = require('express-session');
const path = require('path');

// Initialize the Express app
const app = express();

// --- Middleware Setup ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- MySQL Database Connection ---
const db = require('./models/db'); 

// --- Session Configuration ---
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
}, db);

app.set('trust proxy', 1);

app.use(session({
    key: 'wellness360_cookie',
    secret: process.env.SESSION_SECRET || 'a_strong_default_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 
    }
}));

// Middleware: Make session data available to all templates
app.use((req, res, next) => {
    if (req.session.userId && !req.session.user) {
        req.session.user = {
            id: req.session.userId,
            name: req.session.name,
            profile_pic: req.session.profile_pic,
            email: req.session.email
        };
    }

    // Pass session data to all templates
    res.locals.user = req.session.user || null;
    res.locals.mood = req.session.mood || 'default';
    res.locals.todaySteps = req.session.todaySteps || 0;

    next();
});

// --- View Engine Setup ---
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// --- Scheduled Job ---
app.get('/api/cron', (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).send('Unauthorized');
    }

    console.log("Running daily habit reset job...");

    // Get yesterday's date in YYYY-MM-DD format
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    // Step 1: Log all habits that were marked 'done' yesterday into habit_logs.
    const logSql = `
        INSERT IGNORE INTO habit_logs (habit_id, user_id, date, status)
        SELECT id, user_id, ?, 'done'
        FROM habits
        WHERE status = 'done' AND status_date = ?
    `;

    db.query(logSql, [yesterdayString, yesterdayString], (err, result) => {
        if (err) {
            console.error("Error logging completed habits:", err);
            return res.status(500).send("Database Error");
        }

        if (result.affectedRows > 0) {
            console.log(`Logged ${result.affectedRows} completed habits for ${yesterdayString}`);
        }

        // Step 2: Reset ALL habits to 'pending' user-wise
        const getUsers = `SELECT id FROM users`;
        db.query(getUsers, (errUsers, users) => {
            if (errUsers) {
                console.error("Error fetching users:", errUsers);
                return res.status(500).send("Database Error");
            }

            users.forEach(user => {
                const resetSql = `UPDATE habits SET status='pending', status_date=NULL WHERE user_id=?`;
                db.query(resetSql, [user.id], (err2, result2) => {
                    if (err2) {
                        console.error(`Error resetting habits for user ${user.id}:`, err2);
                    } else {
                        console.log(`Reset ${result2.affectedRows} habits for user ${user.id}`);
                    }
                });
            });
            res.status(200).send("Cron job executed successfully");
        });
    });
});

// --- Route Definitions ---
app.get('/', (req, res) => {
    res.render('landing');
});

// Use modular routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/mood'));
app.use('/', require('./routes/todo'));
app.use('/', require('./routes/moodchart'));
app.use('/', require('./routes/habit'));
app.use('/', require('./routes/pomodoro'));
app.use('/', require('./routes/exercise'));
app.use('/', require('./routes/admin'));
app.use('/', require('./routes/profile'));
app.use('/', require('./routes/steps'));
app.use('/', require('./routes/quotes'));
app.use('/', require('./routes/chatbot'));

// --- Server Startup ---
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;