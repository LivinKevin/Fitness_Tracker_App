const express = require('express');
const cors = require('cors');
require('dotenv').config();

const exerciseRoutes = require('./routes/exercises');
const categoryRoutes = require('./routes/categories');
const workoutRoutes = require('./routes/workouts');
const sessionRoutes = require('./routes/sessions');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/exercises', exerciseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Fitness Tracker API is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});