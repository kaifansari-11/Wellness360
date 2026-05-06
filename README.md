Wellness360: Personal Wellness Dashboard
Wellness360 is a full-stack web application designed to be an all-in-one dashboard for tracking and improving personal well-being and productivity. Users can create a secure account to monitor their daily habits, manage tasks, and log their moods, helping them build consistency and gain insights into their daily lives.

## Features
📈 Dynamic Habit Tracker: Add, complete, and delete daily habits. Progress is visualized on a 7-day chart, and streaks are calculated to encourage consistency.

😊 Mood Journal: Log daily moods, which are then plotted on a historical graph to help users identify emotional patterns over time.

✅ Task Management: A simple and effective to-do list for managing daily responsibilities.

⏲️ Productivity Tools: Includes a Pomodoro timer to help with focus management.

🔒 Secure User Authentication: Features a complete session-based authentication system for personalized user accounts.

## Technology Stack
Backend: Node.js, Express.js

Frontend: EJS (Embedded JavaScript) for server-side rendering, Chart.js for data visualization.

Database: MySQL

Authentication: Express Session

## Getting Started
To run this project locally, follow these steps:
Step 1:
Clone the repository:


git clone https://github.com/your-username/wellness360.git

Step 2:
Install dependencies:


npm install

Step 3:
Set up your environment variables:

Create a file named .env in the root directory.

Add your database credentials and a session secret:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=wellness360
SESSION_SECRET=a_strong_secret_key

Step 4:
Start the server:


npm start
The application will be running at http://localhost:3000.