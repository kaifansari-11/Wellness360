# Wellness360

A full-stack personal wellness dashboard designed to help users improve their physical, mental, and emotional well-being through habit tracking, mood monitoring, productivity tools, and AI-powered wellness support.

**Live Demo:** https://wellness360-4.onrender.com

---

## Overview

Wellness360 simplifies the process of maintaining a healthy lifestyle by providing a centralized platform for tracking habits, moods, daily activities, and productivity. The application combines wellness tracking with intelligent recommendations, enabling users to build positive routines, monitor emotional patterns, and stay focused on personal goals.

---

## Features

### Role-Based Authentication

* Secure user registration and login
* Separate dashboards for Administrators and Standard Users
* Password encryption using bcrypt
* Session-based authentication and authorization

### Admin Dashboard

* Overview of platform statistics
* User management interface
* Ban, unban, and delete user accounts
* Motivational quote management
* User activity analytics and charts

### User Dashboard

* Personalized wellness overview
* Daily step tracking
* Dynamic motivational quotes
* Mood-aware wellness recommendations

### Habit Tracking

* Create and manage daily habits
* Automatic streak calculations
* 7-day progress visualization
* 30-day habit performance reports

### Task Management

* Interactive to-do list
* Daily task organization
* Completion tracking

### Mood Journal & Analytics

* Record daily moods
* Historical mood tracking
* 7-day mood trend charts
* 30-day mood distribution analytics

### Health & Productivity Tools

* Pomodoro focus timer
* Mood-based exercise recommendations
* Workout completion tracking
* Step goal monitoring and history

### AI Wellness Companion

* Powered by Groq (Llama 3.1 8B)
* Conversational wellness assistant
* Mood-aware responses
* Personalized wellness guidance

---

## Technology Stack

| Layer          | Technology                    |
| -------------- | ----------------------------- |
| Backend        | Node.js, Express.js           |
| Frontend       | EJS, HTML5, CSS3, Chart.js    |
| Database       | TiDB Cloud (MySQL-Compatible) |
| Authentication | Express Session, bcrypt       |
| AI Integration | Groq SDK                      |
| Deployment     | Render                        |

---

## Installation and Setup

### Prerequisites

* Node.js (v18 or higher)
* TiDB Cloud Account
* Groq API Account

### Installation

```bash
# Clone the repository
git clone https://github.com/kaifansari-11/wellness360.git

# Navigate to the project directory
cd wellness360

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env

# Configure environment variables
# Add TiDB credentials, session secret, and Groq API key

# Run the database schema in TiDB Cloud
# Execute db/schema.sql using the TiDB SQL Editor

# Seed the Admin account
node seedAdmin.js

# Start the development server
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## Database Configuration

1. Create a Serverless Cluster in TiDB Cloud.

2. Open the **Connect** section and obtain:

   * Host
   * Port
   * Username
   * Password

3. Open the **SQL Editor** and execute the contents of `db/schema.sql`.

4. Add the database credentials to your `.env` file.

---

## Application Routes

| Method    | Route           | Description              |
| --------- | --------------- | ------------------------ |
| GET       | `/`             | Landing Page             |
| GET, POST | `/login`        | User and Admin Login     |
| GET, POST | `/signup`       | User Registration        |
| GET       | `/dashboard`    | Main User Dashboard      |
| GET       | `/admin`        | Administrative Dashboard |
| GET, POST | `/habits`       | Habit Tracking           |
| GET, POST | `/todo`         | Task Management          |
| GET, POST | `/mood`         | Mood Logging             |
| GET       | `/mood-history` | Mood Analytics           |
| GET, POST | `/exercise`     | Exercise Tracking        |
| GET, POST | `/steps`        | Step Tracking            |
| GET       | `/pomodoro`     | Focus Timer              |
| GET, POST | `/chat`         | AI Wellness Companion    |
| GET, POST | `/profile`      | User Profile Management  |

---

## Deployment

### Render

1. Push the repository to GitHub.
2. Create a new Web Service on Render.
3. Connect the GitHub repository.
4. Configure the service:

```text
Build Command: npm install
Start Command: node app.js
```

5. Add all required environment variables.
6. Deploy the application.

---

## Project Structure

```text
wellness360/
├── models/
│   └── db.js
│
├── routes/
│   ├── admin.js
│   ├── auth.js
│   ├── chatbot.js
│   ├── exercise.js
│   ├── habit.js
│   ├── mood.js
│   ├── moodchart.js
│   ├── pomodoro.js
│   ├── profile.js
│   ├── quotes.js
│   ├── steps.js
│   └── todo.js
│
├── views/
│   ├── partials/
│   │   ├── _footer.ejs
│   │   ├── _header.ejs
│   │   └── _sidebar.ejs
│   │
│   ├── admin.ejs
│   ├── chat.ejs
│   ├── dashboard.ejs
│   ├── editprofile.ejs
│   ├── exercise.ejs
│   ├── habit-progress.ejs
│   ├── habits.ejs
│   ├── landing.ejs
│   ├── login.ejs
│   ├── mood.ejs
│   ├── moodhistory.ejs
│   ├── pomodoro.ejs
│   ├── profile.ejs
│   ├── signup.ejs
│   └── todo.ejs
│
├── public/
│   ├── css/
│   │   ├── auth.css
│   │   ├── main.css
│   │   ├── mobile.css
│   │   └── style.css
│   └── uploads/
│
├── app.js
├── seedAdmin.js
└── package.json
```

---

## Author

**Kaif Ansari**

Portfolio: https://kaifansari-dev.netlify.app

GitHub: https://github.com/kaifansari-11

---

## License

This project is intended for educational, portfolio, and learning purposes.
