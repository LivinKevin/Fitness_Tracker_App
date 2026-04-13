const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all users
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM User ORDER BY name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single user with their workouts
router.get('/:id', async (req, res) => {
    try {
        const [user] = await pool.query(
            'SELECT * FROM User WHERE user_id = ?',
            [req.params.id]
        );
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });

        const [workouts] = await pool.query(
            'SELECT * FROM Workout WHERE user_id = ? ORDER BY workout_date DESC',
            [req.params.id]
        );
        res.json({ ...user[0], workouts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create a new user
router.post('/', async (req, res) => {
    try {
        const { name, email, age, weight } = req.body;

        // basic validation
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO User (name, email, age, weight) VALUES (?, ?, ?, ?)',
            [name, email, age || null, weight || null]
        );
        res.status(201).json({ message: 'User created', user_id: result.insertId });
    } catch (err) {
        // handle duplicate email
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'A user with that email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT update a user
router.put('/:id', async (req, res) => {
    try {
        const { name, email, age, weight } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const [result] = await pool.query(
            'UPDATE User SET name = ?, email = ?, age = ?, weight = ? WHERE user_id = ?',
            [name, email, age || null, weight || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User updated' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'A user with that email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE a user
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM User WHERE user_id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;