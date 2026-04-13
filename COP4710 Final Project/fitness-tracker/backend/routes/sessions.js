const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all sessions (with workout and exercise info)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT s.session_id, s.workout_id, s.exercise_id, s.session_date,
                    s.start_time, s.end_time, s.notes,
                    w.workout_type,
                    e.exercise_name, e.muscle_group
             FROM Session s
             INNER JOIN Workout w ON s.workout_id = w.workout_id
             LEFT JOIN EXERCISE e ON s.exercise_id = e.exercise_id
             ORDER BY s.session_date DESC, s.start_time DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET sessions for a specific workout
router.get('/workout/:workoutId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT s.*, e.exercise_name, e.muscle_group
             FROM Session s
             LEFT JOIN EXERCISE e ON s.exercise_id = e.exercise_id
             WHERE s.workout_id = ?
             ORDER BY s.start_time`,
            [req.params.workoutId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single session by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT s.session_id, s.workout_id, s.exercise_id, s.session_date,
                    s.start_time, s.end_time, s.notes,
                    w.workout_type,
                    e.exercise_name, e.muscle_group
             FROM Session s
             INNER JOIN Workout w ON s.workout_id = w.workout_id
             LEFT JOIN EXERCISE e ON s.exercise_id = e.exercise_id
             WHERE s.session_id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create new session
router.post('/', async (req, res) => {
    try {
        const { workout_id, exercise_id, session_date, start_time, end_time, notes } = req.body;

        if (!workout_id || !session_date) {
            return res.status(400).json({ error: 'Workout ID and session date are required' });
        }

        const [result] = await pool.query(
            `INSERT INTO Session (workout_id, exercise_id, session_date, start_time, end_time, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [workout_id, exercise_id || null, session_date, start_time || null, end_time || null, notes || null]
        );
        res.status(201).json({ message: 'Session created', session_id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Invalid workout_id or exercise_id' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT update a session
router.put('/:id', async (req, res) => {
    try {
        const { workout_id, exercise_id, session_date, start_time, end_time, notes } = req.body;

        if (!workout_id || !session_date) {
            return res.status(400).json({ error: 'Workout ID and session date are required' });
        }

        const [result] = await pool.query(
            `UPDATE Session SET workout_id = ?, exercise_id = ?, session_date = ?,
                    start_time = ?, end_time = ?, notes = ?
             WHERE session_id = ?`,
            [workout_id, exercise_id || null, session_date, start_time || null, end_time || null, notes || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Session not found' });
        res.json({ message: 'Session updated' });
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Invalid workout_id or exercise_id' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE a session
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM Session WHERE session_id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Session not found' });
        res.json({ message: 'Session deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;