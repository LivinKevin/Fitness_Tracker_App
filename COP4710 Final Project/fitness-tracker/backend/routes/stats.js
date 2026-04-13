const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET workout summary (uses workout_summary view)
router.get('/workout-summary', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM workout_summary ORDER BY workout_date DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET exercise usage stats (uses exercise_stats view)
router.get('/exercise-stats', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM exercise_stats ORDER BY times_used DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;