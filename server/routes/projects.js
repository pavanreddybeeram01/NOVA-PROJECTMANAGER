const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get All Projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [projects] = await db.execute('SELECT p.*, u.name as creator_name FROM projects p LEFT JOIN users u ON p.created_by = u.id ORDER BY p.created_at DESC');
    return res.json({ success: true, projects });
  } catch (err) {
    console.error('Fetch projects error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
});

// Create Project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, status, color, category, budget, start_date, end_date } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Project title is required.' });
    }

    const [result] = await db.execute(
      'INSERT INTO projects (title, description, status, color, category, budget, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title,
        description || '',
        status || 'Planning',
        color || '#6366f1',
        category || 'Engineering',
        budget || 0,
        start_date || null,
        end_date || null,
        req.user.id
      ]
    );

    const projectId = result.insertId;

    // Log Activity
    await db.execute('INSERT INTO activity_logs (user_id, project_id, action, details) VALUES (?, ?, ?, ?)', [
      req.user.id,
      projectId,
      `Created project: "${title}"`,
      `Category: ${category || 'Engineering'}, Status: ${status || 'Planning'}`
    ]);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      projectId
    });
  } catch (err) {
    console.error('Create project error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create project.' });
  }
});

// Update Project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, description, status, color, category, budget, end_date } = req.body;

    await db.execute(
      'UPDATE projects SET title = ?, description = ?, status = ?, color = ?, category = ?, budget = ?, end_date = ? WHERE id = ?',
      [title, description, status, color, category, budget, end_date, projectId]
    );

    await db.execute('INSERT INTO activity_logs (user_id, project_id, action, details) VALUES (?, ?, ?, ?)', [
      req.user.id,
      projectId,
      `Updated project: "${title}"`,
      `Status changed to ${status}`
    ]);

    return res.json({ success: true, message: 'Project updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update project.' });
  }
});

// Delete Project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = req.params.id;

    await db.execute('DELETE FROM projects WHERE id = ?', [projectId]);

    await db.execute('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [
      req.user.id,
      `Deleted project #${projectId}`,
      'Project and related tasks removed'
    ]);

    return res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
});

module.exports = router;
