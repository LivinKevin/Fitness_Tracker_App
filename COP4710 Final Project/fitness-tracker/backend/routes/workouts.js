const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all workouts (with user name)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT w.workout_id, w.workout_date, w.duration_minutes,
                    w.workout_type, w.user_id, u.name AS user_name
             FROM Workout w
             INNER JOIN User u ON w.user_id = u.user_id
             ORDER BY w.workout_date DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET workouts for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT w.workout_id, w.workout_date, w.duration_minutes,
                    w.workout_type, w.user_id
             FROM Workout w
             WHERE w.user_id = ?
             ORDER BY w.workout_date DESC`,
            [req.params.userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single workout by ID (with its sessions)
router.get('/:id', async (req, res) => {
    try {
        const [workout] = await pool.query(
            `SELECT w.workout_id, w.workout_date, w.duration_minutes,
                    w.workout_type, w.user_id, u.name AS user_name
             FROM Workout w
             INNER JOIN User u ON w.user_id = u.user_id
             WHERE w.workout_id = ?`,
            [req.params.id]
        );
        if (workout.length === 0) return res.status(404).json({ error: 'Workout not found' });

        const [sessions] = await pool.query(
            'SELECT * FROM Session WHERE workout_id = ? ORDER BY start_time',
            [req.params.id]
        );
        res.json({ ...workout[0], sessions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create new workout
router.post('/', async (req, res) => {
    try {
        const { workout_date, duration_minutes, workout_type, user_id } = req.body;

        if (!workout_date || !user_id) {
            return res.status(400).json({ error: 'Workout date and user_id are required' });
        }

        const [result] = await pool.query(
            `INSERT INTO Workout (workout_date, duration_minutes, workout_type, user_id)
             VALUES (?, ?, ?, ?)`,
            [workout_date, duration_minutes || 0, workout_type || null, user_id]
        );
        res.status(201).json({ message: 'Workout created', workout_id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Invalid user_id' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT update a workout
router.put('/:id', async (req, res) => {
    try {
        const { workout_date, duration_minutes, workout_type, user_id } = req.body;

        if (!workout_date || !user_id) {
            return res.status(400).json({ error: 'Workout date and user_id are required' });
        }

        const [result] = await pool.query(
            `UPDATE Workout SET workout_date = ?, duration_minutes = ?, workout_type = ?, user_id = ?
             WHERE workout_id = ?`,
            [workout_date, duration_minutes || 0, workout_type || null, user_id, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Workout not found' });
        res.json({ message: 'Workout updated' });
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Invalid user_id' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE a workout
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM Workout WHERE workout_id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Workout not found' });
        res.json({ message: 'Workout deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;