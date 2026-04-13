# Fitness Tracker App

## Team Members
- Jorge Carmenate
- Kevin Herrera
- Kevin Garcia
- Paola Oropeza

## Tech Stack
- **Frontend:** React (Vite)
- **Backend:** Node.js / Express
- **Database:** MySQL

## Database Schema
Five normalized tables with full referential integrity:
- **User** — registered users
- **Category** — exercise categories (Strength, Cardio, Flexibility, HIIT)
- **Exercise** — individual exercises linked to a category
- **Workout** — a user's workout session on a given date
- **Session** — each exercise performed within a workout, with start/end times

## Advanced Features
- **Views:** `workout_summary` (workout details with session counts) and `exercise_stats` (exercise usage frequency)
- **Trigger:** `update_workout_duration_after_delete` automatically recalculates a workout's total duration when a session is removed

## Setup Instructions

### 1. Database
1. Make sure MySQL is running
2. Open MySQL Workbench and connect to your local instance
3. Open `database/setup.sql` and run it

### 2. Backend
```bash
cd backend
npm install
node server.js
```
Server runs on `http://localhost:5000`.

Make sure `backend/.env` has your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YourPasswordHere
DB_NAME=fitness_tracker
PORT=5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Opens on `http://localhost:5173` (or whichever port Vite assigns).

## Features
- Browse and filter exercises by category, muscle group, or search term
- Build a workout by adding exercises from the catalog
- Strength exercises track sets, reps, and weight
- Cardio/flexibility exercises track duration in minutes
- Save workouts to the database with session-level detail
- Switch between users via the dropdown in the header
- View workout history filtered by the selected user

## Project Structure
```
├── database/
│   └── setup.sql
├── backend/
│   ├── server.js
│   ├── db.js
│   └── routes/
│       ├── users.js
│       ├── categories.js
│       ├── exercises.js
│       ├── workouts.js
│       ├── sessions.js
│       └── stats.js
├── frontend/
│   └── src/
│       └── App.jsx
├── db_proof/
│   ├── schema.sql
│   ├── data.sql
│   ├── constraints_test.sql
│   ├── queries.sql
│   └── query_outputs.txt
└── README.md
```

## API Endpoints

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | /api/users                        | All users                      |
| GET    | /api/users/:id                    | User with their workouts       |
| POST   | /api/users                        | Create user                    |
| PUT    | /api/users/:id                    | Update user                    |
| DELETE | /api/users/:id                    | Delete user                    |
| GET    | /api/categories                   | All categories                 |
| GET    | /api/categories/:id               | Category with its exercises    |
| POST   | /api/categories                   | Create category                |
| PUT    | /api/categories/:id               | Update category                |
| DELETE | /api/categories/:id               | Delete category                |
| GET    | /api/exercises                    | All exercises with category    |
| GET    | /api/exercises/:id                | Single exercise                |
| GET    | /api/exercises/category/:id       | Exercises by category          |
| GET    | /api/exercises/muscle/:group      | Exercises by muscle group      |
| POST   | /api/exercises                    | Create exercise                |
| PUT    | /api/exercises/:id                | Update exercise                |
| DELETE | /api/exercises/:id                | Delete exercise                |
| GET    | /api/workouts                     | All workouts with user name    |
| GET    | /api/workouts/:id                 | Workout with its sessions      |
| GET    | /api/workouts/user/:id            | Workouts for a user            |
| POST   | /api/workouts                     | Create workout                 |
| PUT    | /api/workouts/:id                 | Update workout                 |
| DELETE | /api/workouts/:id                 | Delete workout                 |
| GET    | /api/sessions                     | All sessions with exercise info|
| GET    | /api/sessions/:id                 | Single session                 |
| GET    | /api/sessions/workout/:id         | Sessions for a workout         |
| POST   | /api/sessions                     | Create session                 |
| PUT    | /api/sessions/:id                 | Update session                 |
| DELETE | /api/sessions/:id                 | Delete session                 |
| GET    | /api/stats/workout-summary        | Workout summary view           |
| GET    | /api/stats/exercise-stats         | Exercise usage stats view      |
