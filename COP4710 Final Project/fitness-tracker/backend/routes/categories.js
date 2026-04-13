const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all categories
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM CATEGORY ORDER BY category_name');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single category with its exercises
router.get('/:id', async (req, res) => {
    try {
        const [category] = await pool.query(
            'SELECT * FROM CATEGORY WHERE category_id = ?',
            [req.params.id]
        );
        if (category.length === 0) return res.status(404).json({ error: 'Category not found' });

        const [exercises] = await pool.query(
            'SELECT * FROM EXERCISE WHERE category_id = ? ORDER BY exercise_name',
            [req.params.id]
        );
        res.json({ ...category[0], exercises });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create a new category
router.post('/', async (req, res) => {
    try {
        const { category_name, description } = req.body;

        if (!category_name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const [result] = await pool.query(
            'INSERT INTO CATEGORY (category_name, description) VALUES (?, ?)',
            [category_name, description || null]
        );
        res.status(201).json({ message: 'Category created', category_id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'That category name already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT update a category
router.put('/:id', async (req, res) => {
    try {
        const { category_name, description } = req.body;

        if (!category_name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const [result] = await pool.query(
            'UPDATE CATEGORY SET category_name = ?, description = ? WHERE category_id = ?',
            [category_name, description || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category updated' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'That category name already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE a category
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM CATEGORY WHERE category_id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;