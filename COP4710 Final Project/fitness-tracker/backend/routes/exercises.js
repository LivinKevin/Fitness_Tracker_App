const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all exercises (joined with category)
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.exercise_id, e.exercise_name, e.category_id,
                    c.category_name, e.muscle_group, e.equipment_needed
             FROM EXERCISE e
             INNER JOIN CATEGORY c ON e.category_id = c.category_id
             ORDER BY c.category_name, e.exercise_name`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET exercises filtered by category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.exercise_id, e.exercise_name, e.category_id,
                    c.category_name, e.muscle_group, e.equipment_needed
             FROM EXERCISE e
             INNER JOIN CATEGORY c ON e.category_id = c.category_id
             WHERE e.category_id = ?
             ORDER BY e.exercise_name`,
            [req.params.categoryId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET exercises filtered by muscle group
router.get('/muscle/:muscleGroup', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.exercise_id, e.exercise_name, e.category_id,
                    c.category_name, e.muscle_group, e.equipment_needed
             FROM EXERCISE e
             INNER JOIN CATEGORY c ON e.category_id = c.category_id
             WHERE e.muscle_group LIKE ?
             ORDER BY e.exercise_name`,
            [`%${req.params.muscleGroup}%`]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single exercise by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT e.exercise_id, e.exercise_name, e.category_id,
                    c.category_name, e.muscle_group, e.equipment_needed
             FROM EXERCISE e
             INNER JOIN CATEGORY c ON e.category_id = c.category_id
             WHERE e.exercise_id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Exercise not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create new exercise
router.post('/', async (req, res) => {
    try {
        const { category_id, exercise_name, muscle_group, equipment_needed } = req.body;

        if (!exercise_name || !category_id) {
            return res.status(400).json({ error: 'Exercise name and category are required' });
        }

        const [result] = await pool.query(
            `INSERT INTO EXERCISE (category_id, exercise_name, muscle_group, equipment_needed)
             VALUES (?, ?, ?, ?)`,
            [category_id, exercise_name, muscle_group || null, equipment_needed || null]
        );
        res.status(201).json({ message: 'Exercise created', exercise_id: result.insertId });
    } catch (err) {
        // catches invalid category_id (FK constraint)
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Invalid category_id' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT update exercise
router.put('/:id', async (req, res) => {
    try {
        const { category_id, exercise_name, muscle_group, equipment_needed } = req.body;

        if (!exercise_name || !category_id) {
            return res.status(400).json({ error: 'Exercise name and category are required' });
        }

        const [result] = await pool.query(
            `UPDATE EXERCISE
             SET category_id = ?, exercise_name = ?, muscle_group = ?, equipment_needed = ?
             WHERE exercise_id = ?`,
            [category_id, exercise_name, muscle_group || null, equipment_needed || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Exercise not found' });
        res.json({ message: 'Exercise updated' });
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Invalid category_id' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE exercise
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM EXERCISE WHERE exercise_id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Exercise not found' });
        res.json({ message: 'Exercise deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;