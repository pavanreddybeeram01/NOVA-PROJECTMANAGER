const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get All Tasks (Optional filter by project_id)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projectId = req.query.project_id;
    let sql = `
      SELECT t.*, u.name as assignee_name, u.avatar as assignee_avatar, p.title as project_title 
      FROM tasks t 
      LEFT JOIN users u ON t.assignee_id = u.id 
      LEFT JOIN projects p ON t.project_id = p.id
    `;
    const params = [];
    if (projectId) {
      sql += ' WHERE t.project_id = ?';
      params.push(projectId);
    }
    sql += ' ORDER BY t.created_at DESC';

    const [tasks] = await db.execute(sql, params);
    return res.json({ success: true, tasks });
  } catch (err) {
    console.error('Fetch tasks error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
});

// Create Task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { project_id, title, description, status, priority, assignee_id, due_date, subtasks } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ success: false, message: 'Project ID and title are required.' });
    }

    const [result] = await db.execute(
      'INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        project_id,
        title,
        description || '',
        status || 'todo',
        priority || 'Medium',
        assignee_id || null,
        due_date || null
      ]
    );

    const taskId = result.insertId;

    // Add subtasks if provided
    if (Array.isArray(subtasks) && subtasks.length > 0) {
      for (const st of subtasks) {
        if (st.title) {
          await db.execute('INSERT INTO subtasks (task_id, title, completed) VALUES (?, ?, ?)', [
            taskId,
            st.title,
            st.completed ? 1 : 0
          ]);
        }
      }
    }

    // Log Activity
    await db.execute('INSERT INTO activity_logs (user_id, project_id, action, details) VALUES (?, ?, ?, ?)', [
      req.user.id,
      project_id,
      `Created task: "${title}"`,
      `Priority: ${priority || 'Medium'}, Status: ${status || 'todo'}`
    ]);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      taskId
    });
  } catch (err) {
    console.error('Create task error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create task.' });
  }
});

// Update Task Status (Kanban Drag & Drop / Column Switch)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    await db.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);

    // Log Activity
    await db.execute('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [
      req.user.id,
      `Updated task #${taskId} status to ${status.toUpperCase()}`,
      `Task column moved`
    ]);

    return res.json({ success: true, message: 'Task status updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update task status.' });
  }
});

// Update Task Assignee
router.put('/:id/assign', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { assignee_id } = req.body;

    const assigneeVal = assignee_id ? Number(assignee_id) : null;
    await db.execute('UPDATE tasks SET assignee_id = ? WHERE id = ?', [assigneeVal, taskId]);

    // Fetch assignee user info for log
    let assigneeName = 'Unassigned';
    if (assigneeVal) {
      const [users] = await db.execute('SELECT name FROM users WHERE id = ?', [assigneeVal]);
      if (users && users.length > 0) assigneeName = users[0].name;
    }

    // Log Activity
    await db.execute('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [
      req.user.id,
      `Reassigned task #${taskId}`,
      `Assigned to ${assigneeName}`
    ]);

    return res.json({ success: true, message: `Task assigned to ${assigneeName}.` });
  } catch (err) {
    console.error('Assign task error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign task.' });
  }
});

// Add Comment to Task
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    const [result] = await db.execute(
      'INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)',
      [taskId, req.user.id, comment.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'Comment added.',
      commentId: result.insertId
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
});

// Update Subtask Status
router.put('/subtasks/:subtaskId', authenticateToken, async (req, res) => {
  try {
    const subtaskId = req.params.subtaskId;
    const { completed } = req.body;

    await db.execute('UPDATE subtasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, subtaskId]);
    return res.json({ success: true, message: 'Subtask status toggled.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update subtask.' });
  }
});

// Delete Task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    await db.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
    return res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
});

module.exports = router;
