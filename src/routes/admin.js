const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Get All Users and their Lists (for Admin Dashboard)
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, total_score, role FROM users WHERE role != ?', ['admin']);

        // Get all lists
        const [lists] = await db.query('SELECT * FROM lists');

        // Combine data
        const data = users.map(user => {
            const userList = lists.filter(item => item.user_id === user.id);
            return {
                ...user,
                list: userList
            };
        });

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Score (Set Age/Dead status)
router.post('/score', verifyAdmin, async (req, res) => {
    const { listId, age, isDead, bonusPoints } = req.body;

    if (!listId || typeof isDead !== 'boolean') {
        return res.status(400).json({ message: 'Invalid data' });
    }

    // Validar puntos extra (máximo 20)
    let validBonusPoints = 0;
    if (isDead && bonusPoints !== undefined && bonusPoints !== null) {
        validBonusPoints = Math.min(Math.max(0, parseInt(bonusPoints) || 0), 20);
    }

    let basePoints = 0;
    if (isDead && age !== undefined) {
        if (age <= 20) basePoints = 100;
        else if (age <= 40) basePoints = 70;
        else if (age <= 60) basePoints = 40;
        else if (age <= 80) basePoints = 20;
        else basePoints = 10;
    }

    // Puntos totales = puntos base + puntos bonus
    const totalPoints = basePoints + validBonusPoints;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Update list item
        await connection.query(
            'UPDATE lists SET age = ?, is_dead = ?, calculated_points = ?, bonus_points = ? WHERE id = ?',
            [age, isDead, totalPoints, validBonusPoints, listId]
        );

        // Recalculate Total Score for the User
        // 1. Get user_id for this list item
        const [rows] = await connection.query('SELECT user_id FROM lists WHERE id = ?', [listId]);
        if (rows.length === 0) {
            throw new Error('List item not found');
        }
        const userId = rows[0].user_id;

        // 2. Sum points (calculated_points ya incluye los bonus)
        const [sumRows] = await connection.query('SELECT SUM(calculated_points) as total FROM lists WHERE user_id = ?', [userId]);
        const totalScore = sumRows[0].total || 0;

        // 3. Update User table
        await connection.query('UPDATE users SET total_score = ? WHERE id = ?', [totalScore, userId]);

        await connection.commit();
        res.json({ 
            message: 'Score updated', 
            basePoints, 
            bonusPoints: validBonusPoints, 
            totalPoints,
            totalScore 
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
});

// Get Deadline Date
router.get('/deadline', verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT config_value FROM config WHERE config_key = ?', ['deadline_date']);
        
        if (rows.length === 0) {
            // If no deadline exists, use environment variable or default
            const defaultDeadline = process.env.DEADLINE_DATE || '2025-12-31T23:59:59';
            // Insert default deadline
            await db.query('INSERT INTO config (config_key, config_value) VALUES (?, ?)', ['deadline_date', defaultDeadline]);
            return res.json({ deadline: defaultDeadline });
        }
        
        res.json({ deadline: rows[0].config_value });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Deadline Date
router.post('/deadline', verifyAdmin, async (req, res) => {
    const { deadline } = req.body;

    if (!deadline) {
        return res.status(400).json({ message: 'Deadline date is required' });
    }

    // Validate date format
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
    }

    try {
        // Check if deadline exists
        const [rows] = await db.query('SELECT id FROM config WHERE config_key = ?', ['deadline_date']);
        
        if (rows.length === 0) {
            // Insert new deadline
            await db.query('INSERT INTO config (config_key, config_value) VALUES (?, ?)', ['deadline_date', deadline]);
        } else {
            // Update existing deadline
            await db.query('UPDATE config SET config_value = ? WHERE config_key = ?', [deadline, 'deadline_date']);
        }

        res.json({ message: 'Deadline updated successfully', deadline });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
