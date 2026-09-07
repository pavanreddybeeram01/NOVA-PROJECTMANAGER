const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get All Team Members
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [members] = await db.execute('SELECT id, name, email, role, avatar, title, created_at FROM users ORDER BY name ASC');
    return res.json({ success: true, members });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch team members.' });
  }
});

// Update Member Role (Admin / Manager only)
router.put('/:id/role', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager') {
      return res.status(403).json({ success: false, message: 'Only Admin or Manager can update roles.' });
    }

    const userId = req.params.id;
    const { role } = req.body;

    if (!['Admin', 'Manager', 'Member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

    await db.execute('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [
      req.user.id,
      `Updated user role to ${role}`,
      `Target user ID: ${userId}`
    ]);

    return res.json({ success: true, message: 'User role updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user role.' });
  }
});

module.exports = router;
