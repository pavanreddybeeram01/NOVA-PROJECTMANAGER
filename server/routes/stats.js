const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get Dashboard Metrics & Analytics Overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const [projects] = await db.execute('SELECT p.*, u.name as creator_name FROM projects p LEFT JOIN users u ON p.created_by = u.id');
    const [tasks] = await db.execute('SELECT t.*, u.name as assignee_name FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id');
    const [team] = await db.execute('SELECT id, name, role, avatar, title FROM users');
    const [logs] = await db.execute('SELECT l.*, u.name as user_name, u.avatar as user_avatar FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 15');

    const totalProjects = projects.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    const inReviewTasks = tasks.filter(t => t.status === 'in_review').length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalMembers = team.length;

    // Calculate project progress breakdown
    const projectProgress = projects.map(p => {
      const pTasks = tasks.filter(t => t.project_id === p.id);
      const pDone = pTasks.filter(t => t.status === 'completed').length;
      const progress = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
      return {
        id: p.id,
        title: p.title,
        status: p.status,
        color: p.color,
        category: p.category,
        totalTasks: pTasks.length,
        completedTasks: pDone,
        progress
      };
    });

    return res.json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        inReviewTasks,
        completionRate,
        totalMembers,
        dbEngine: db.getMode()
      },
      projectProgress,
      recentActivity: logs
    });
  } catch (err) {
    console.error('Stats endpoint error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics.' });
  }
});

module.exports = router;
