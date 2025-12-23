const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get My List
router.get('/', verifyToken, async (req, res) => {
    try {
        const [list] = await db.query('SELECT * FROM lists WHERE user_id = ?', [req.user.id]);
        res.json(list);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Deadline Date (for regular users)
router.get('/deadline', verifyToken, async (req, res) => {
    try {
        const deadlineString = await getDeadline();
        res.json({ deadline: deadlineString });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to get deadline from database
async function getDeadline() {
    try {
        const [rows] = await db.query('SELECT config_value FROM config WHERE config_key = ?', ['deadline_date']);
        
        if (rows.length === 0) {
            // Fallback to environment variable or default
            return process.env.DEADLINE_DATE || '2025-12-31T23:59:59';
        }
        
        return rows[0].config_value;
    } catch (error) {
        console.error('Error getting deadline:', error);
        // Fallback to environment variable or default
        return process.env.DEADLINE_DATE || '2025-12-31T23:59:59';
    }
}

// Update/Save List
router.post('/', verifyToken, async (req, res) => {
    // Prevent admins from saving lists
    if (req.user.role === 'admin') {
        return res.status(403).json({ message: 'Los administradores no pueden crear predicciones.' });
    }

    const { names } = req.body; // Array of strings ["Name 1", "Name 2"]

    if (!Array.isArray(names) || names.length > 10) {
        return res.status(400).json({ message: 'List must be an array of up to 10 names.' });
    }

    // Check Deadline
    const deadlineString = await getDeadline();
    const deadline = new Date(deadlineString);
    const now = new Date();

    if (isNaN(deadline.getTime())) {
        console.error('Invalid deadline date:', deadlineString);
        return res.status(500).json({ message: 'Server configuration error' });
    }

    if (now > deadline) {
        return res.status(403).json({ message: 'Que pasó kukardo, se te acabó el tiempo?' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Clear existing list (Simple replacement strategy)
        // IMPORTANT: In a real app, might want to preserve IDs if they are referenced elsewhere, 
        // but here we just want the current set of names.
        await connection.query('DELETE FROM lists WHERE user_id = ?', [req.user.id]);

        if (names.length > 0) {
            const values = names.map(name => [req.user.id, name]);
            await connection.query('INSERT INTO lists (user_id, name) VALUES ?', [values]);
        }

        await connection.commit();
        res.json({ message: 'List saved successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
});

module.exports = router;
