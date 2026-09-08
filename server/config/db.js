const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_FILE = path.join(__dirname, '..', 'data_store.json');

// In-Memory / File Persistent Store structure for Zero-Config execution
let localData = {
  users: [
    { id: 1, name: 'Elena Rostova', email: 'admin@nova.io', password: '$2a$10$wT8K./h6Xo1QzG4A9C4CdeNqgQ8L0vB0K2a.8bY1Z0V1gY2C3D4E5', role: 'Admin', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', title: 'Product Strategist & Admin', created_at: new Date().toISOString() },
    { id: 2, name: 'Alex Chen', email: 'alex@nova.io', password: '$2a$10$wT8K./h6Xo1QzG4A9C4CdeNqgQ8L0vB0K2a.8bY1Z0V1gY2C3D4E5', role: 'Manager', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', title: 'Lead Full-Stack Engineer', created_at: new Date().toISOString() },
    { id: 3, name: 'Sarah Jenkins', email: 'sarah@nova.io', password: '$2a$10$wT8K./h6Xo1QzG4A9C4CdeNqgQ8L0vB0K2a.8bY1Z0V1gY2C3D4E5', role: 'Member', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', title: 'Senior UI/UX Designer', created_at: new Date().toISOString() },
    { id: 4, name: 'David Miller', email: 'david@nova.io', password: '$2a$10$wT8K./h6Xo1QzG4A9C4CdeNqgQ8L0vB0K2a.8bY1Z0V1gY2C3D4E5', role: 'Member', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', title: 'DevOps & Cloud Specialist', created_at: new Date().toISOString() }
  ],
  projects: [
    { id: 1, title: 'NOVA Mobile Suite 2.0', description: 'Next-gen iOS and Android mobile task execution interface with offline sync capabilities.', status: 'In Progress', color: '#6366f1', category: 'Engineering', budget: 45000.00, start_date: '2026-08-01', end_date: '2026-10-30', created_by: 1, created_at: new Date().toISOString() },
    { id: 2, title: 'Brand Identity Redesign', description: 'Comprehensive design language refresh, component library guidelines, and marketing site.', status: 'In Review', color: '#ec4899', category: 'Design', budget: 18000.00, start_date: '2026-07-15', end_date: '2026-09-15', created_by: 3, created_at: new Date().toISOString() },
    { id: 3, title: 'Enterprise Cloud Infra Migration', description: 'Migrating legacy Kubernetes clusters to AWS multi-region serverless infrastructure.', status: 'Planning', color: '#10b981', category: 'DevOps', budget: 62000.00, start_date: '2026-09-01', end_date: '2026-12-15', created_by: 4, created_at: new Date().toISOString() }
  ],
  tasks: [
    { id: 1, project_id: 1, title: 'Design Figma Wireframes for Mobile Kanban', description: 'Create responsive touch-friendly wireframes for task columns.', status: 'completed', priority: 'High', assignee_id: 3, due_date: '2026-09-10', created_at: new Date().toISOString() },
    { id: 2, project_id: 1, title: 'Implement WebSocket Realtime Event Synchronization', description: 'Setup socket connection for instant board updates across teammates.', status: 'in_progress', priority: 'Urgent', assignee_id: 2, due_date: '2026-09-18', created_at: new Date().toISOString() },
    { id: 3, project_id: 1, title: 'Write React Native Offline Caching Layer', description: 'Use SQLite native bridge to store pending actions when offline.', status: 'todo', priority: 'Medium', assignee_id: 2, due_date: '2026-09-25', created_at: new Date().toISOString() },
    { id: 4, project_id: 2, title: 'Dark Mode Glassmorphism Token Specification', description: 'Finalize CSS variables for background blurs, borders, and shadows.', status: 'completed', priority: 'High', assignee_id: 3, due_date: '2026-08-30', created_at: new Date().toISOString() },
    { id: 5, project_id: 2, title: 'Audit Typography and Accessibility Standards', description: 'Ensure WCAG AA contrast compliance across light/dark themes.', status: 'in_review', priority: 'Medium', assignee_id: 3, due_date: '2026-09-12', created_at: new Date().toISOString() },
    { id: 6, project_id: 3, title: 'Terraform Scripts for Multi-Region AWS VPC', description: 'Write reusable IaC modules for staging and production environments.', status: 'todo', priority: 'Urgent', assignee_id: 4, due_date: '2026-09-20', created_at: new Date().toISOString() }
  ],
  subtasks: [
    { id: 1, task_id: 1, title: 'Mobile board drawer view', completed: 1 },
    { id: 2, task_id: 1, title: 'Touch gesture swipe columns', completed: 1 },
    { id: 3, task_id: 2, title: 'Client reconnection retry logic', completed: 1 },
    { id: 4, task_id: 2, title: 'Server payload broadcasting test', completed: 0 }
  ],
  task_comments: [
    { id: 1, task_id: 2, user_id: 3, comment: 'I have updated the design tokens so the WebSocket status badge sparkles nicely when connected!', created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 2, task_id: 2, user_id: 2, comment: 'Awesome! Testing the connection retry loop right now.', created_at: new Date(Date.now() - 3600000 * 2).toISOString() }
  ],
  project_members: [
    { project_id: 1, user_id: 1 },
    { project_id: 1, user_id: 2 },
    { project_id: 1, user_id: 3 },
    { project_id: 2, user_id: 1 },
    { project_id: 2, user_id: 3 },
    { project_id: 3, user_id: 1 },
    { project_id: 3, user_id: 4 }
  ],
  activity_logs: [
    { id: 1, user_id: 1, project_id: 1, action: 'Created project "NOVA Mobile Suite 2.0"', details: 'Set budget to $45,000', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: 2, user_id: 3, project_id: 1, action: 'Completed task "Design Figma Wireframes for Mobile Kanban"', details: 'Task marked completed', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 3, user_id: 2, project_id: 1, action: 'Moved task "Implement WebSocket Realtime Event Synchronization" to In Progress', details: 'Assigned to Alex Chen', created_at: new Date(Date.now() - 86400000 * 1).toISOString() }
  ]
};

function saveLocalStore() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localData, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save local JSON store:', err);
  }
}

function loadLocalStore() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      localData = JSON.parse(content);
    } catch (err) {
      console.warn('Initializing new local store file...');
      saveLocalStore();
    }
  } else {
    saveLocalStore();
  }
}

let mysqlPool = null;
let activeMode = 'LOCAL';
if (process.env.USE_MYSQL !== 'true') {
  loadLocalStore();
}

async function initPool() {
  if (process.env.USE_MYSQL === 'true') {
    try {
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nova_db',
        ssl: {
          rejectUnauthorized: false
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      // Test connection
      const conn = await mysqlPool.getConnection();
      conn.release();
      activeMode = 'MYSQL';
      console.log(' Successfully connected to MySQL database engine.');
    } catch (err) {
      console.error('MYSQL CONNECTION ERROR:', err);
      console.warn(' MySQL connection unavailable. Switching to embedded data repository.');
      activeMode = 'LOCAL';
    }
  } else {
    console.log(' Running with embedded high-performance DB repository (MySQL compatible).');
    activeMode = 'LOCAL';
  }
}

const dbReady = initPool();

// Generic query proxy interface
const db = {
  getMode: () => activeMode,
  waitReady: () => dbReady,
  saveStore: saveLocalStore,
  getDataStore: () => localData,
  execute: async (sql, params = []) => {
    await dbReady;
    
    if (activeMode === 'MYSQL' && mysqlPool) {
      return mysqlPool.execute(sql, params);
    }
    // Emulated query handler for zero-config instant execution
    return handleEmulatedQuery(sql, params);
  }
};

function handleEmulatedQuery(sql, params) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  
  // Helper ID generator
  const nextId = (list) => (list.length > 0 ? Math.max(...list.map(i => i.id || 0)) + 1 : 1);

  // USERS QUERIES
  if (cleanSql.startsWith('SELECT * FROM users WHERE email = ?')) {
    const email = params[0];
    const user = localData.users.find(u => u.email === email);
    return [[user].filter(Boolean)];
  }

  if (cleanSql.startsWith('SELECT * FROM users WHERE id = ?')) {
    const id = Number(params[0]);
    const user = localData.users.find(u => u.id === id);
    return [[user].filter(Boolean)];
  }

  if (cleanSql.startsWith('SELECT id, name, email, role, avatar, title FROM users')) {
    return [localData.users.map(({ password, ...u }) => u)];
  }

  if (cleanSql.startsWith('INSERT INTO users')) {
    const newUser = {
      id: nextId(localData.users),
      name: params[0],
      email: params[1],
      password: params[2],
      role: params[3] || 'Member',
      avatar: params[4] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${params[0]}`,
      title: params[5] || 'Team Contributor',
      created_at: new Date().toISOString()
    };
    localData.users.push(newUser);
    saveLocalStore();
    return [{ insertId: newUser.id }];
  }

  // PROJECTS QUERIES
  if (cleanSql.includes('FROM projects p')) {
    // Project list query with task stats & creator info
    const result = localData.projects.map(p => {
      const creator = localData.users.find(u => u.id === p.created_by) || {};
      const pTasks = localData.tasks.filter(t => t.project_id === p.id);
      const total_tasks = pTasks.length;
      const completed_tasks = pTasks.filter(t => t.status === 'completed').length;
      const members = localData.project_members
        .filter(pm => pm.project_id === p.id)
        .map(pm => localData.users.find(u => u.id === pm.user_id))
        .filter(Boolean)
        .map(({ password, ...u }) => u);

      return {
        ...p,
        creator_name: creator.name || 'System',
        total_tasks,
        completed_tasks,
        members
      };
    });
    return [result];
  }

  if (cleanSql.startsWith('SELECT * FROM projects WHERE id = ?')) {
    const id = Number(params[0]);
    const project = localData.projects.find(p => p.id === id);
    return [[project].filter(Boolean)];
  }

  if (cleanSql.startsWith('INSERT INTO projects')) {
    const newProj = {
      id: nextId(localData.projects),
      title: params[0],
      description: params[1],
      status: params[2] || 'Planning',
      color: params[3] || '#6366f1',
      category: params[4] || 'General',
      budget: Number(params[5] || 0),
      start_date: params[6] || null,
      end_date: params[7] || null,
      created_by: Number(params[8]),
      created_at: new Date().toISOString()
    };
    localData.projects.push(newProj);
    // Auto add creator to project members
    localData.project_members.push({ project_id: newProj.id, user_id: newProj.created_by });
    saveLocalStore();
    return [{ insertId: newProj.id }];
  }

  if (cleanSql.startsWith('UPDATE projects SET')) {
    const id = Number(params[params.length - 1]);
    const idx = localData.projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      if (params.length >= 7) {
        localData.projects[idx] = {
          ...localData.projects[idx],
          title: params[0],
          description: params[1],
          status: params[2],
          color: params[3],
          category: params[4],
          budget: Number(params[5]),
          end_date: params[6]
        };
      }
      saveLocalStore();
    }
    return [{ affectedRows: 1 }];
  }

  if (cleanSql.startsWith('DELETE FROM projects WHERE id = ?')) {
    const id = Number(params[0]);
    localData.projects = localData.projects.filter(p => p.id !== id);
    localData.tasks = localData.tasks.filter(t => t.project_id !== id);
    localData.project_members = localData.project_members.filter(pm => pm.project_id !== id);
    saveLocalStore();
    return [{ affectedRows: 1 }];
  }

  // TASKS QUERIES
  if (cleanSql.includes('FROM tasks t')) {
    const projectId = params[0] ? Number(params[0]) : null;
    let tasksList = projectId ? localData.tasks.filter(t => t.project_id === projectId) : localData.tasks;
    
    const detailedTasks = tasksList.map(t => {
      const assignee = localData.users.find(u => u.id === t.assignee_id) || null;
      const project = localData.projects.find(p => p.id === t.project_id) || {};
      const subtasks = localData.subtasks.filter(st => st.task_id === t.id);
      const comments = localData.task_comments
        .filter(tc => tc.task_id === t.id)
        .map(tc => {
          const u = localData.users.find(usr => usr.id === tc.user_id) || {};
          return { ...tc, user_name: u.name, user_avatar: u.avatar };
        });

      return {
        ...t,
        assignee_name: assignee ? assignee.name : null,
        assignee_avatar: assignee ? assignee.avatar : null,
        project_title: project.title || 'General',
        subtasks,
        comments
      };
    });
    return [detailedTasks];
  }

  if (cleanSql.startsWith('INSERT INTO tasks')) {
    const newTask = {
      id: nextId(localData.tasks),
      project_id: Number(params[0]),
      title: params[1],
      description: params[2] || '',
      status: params[3] || 'todo',
      priority: params[4] || 'Medium',
      assignee_id: params[5] ? Number(params[5]) : null,
      due_date: params[6] || null,
      created_at: new Date().toISOString()
    };
    localData.tasks.push(newTask);
    saveLocalStore();
    return [{ insertId: newTask.id }];
  }

  if (cleanSql.startsWith('UPDATE tasks SET status = ? WHERE id = ?')) {
    const status = params[0];
    const id = Number(params[1]);
    const task = localData.tasks.find(t => t.id === id);
    if (task) {
      task.status = status;
      saveLocalStore();
    }
    return [{ affectedRows: 1 }];
  }

  if (cleanSql.startsWith('UPDATE tasks SET assignee_id = ? WHERE id = ?')) {
    const assignee_id = params[0] ? Number(params[0]) : null;
    const id = Number(params[1]);
    const task = localData.tasks.find(t => t.id === id);
    if (task) {
      task.assignee_id = assignee_id;
      saveLocalStore();
    }
    return [{ affectedRows: 1 }];
  }

  if (cleanSql.startsWith('DELETE FROM tasks WHERE id = ?')) {
    const id = Number(params[0]);
    localData.tasks = localData.tasks.filter(t => t.id !== id);
    localData.subtasks = localData.subtasks.filter(st => st.task_id !== id);
    localData.task_comments = localData.task_comments.filter(tc => tc.task_id !== id);
    saveLocalStore();
    return [{ affectedRows: 1 }];
  }

  // SUBTASKS & COMMENTS
  if (cleanSql.startsWith('INSERT INTO subtasks')) {
    const newSub = {
      id: nextId(localData.subtasks),
      task_id: Number(params[0]),
      title: params[1],
      completed: params[2] ? 1 : 0
    };
    localData.subtasks.push(newSub);
    saveLocalStore();
    return [{ insertId: newSub.id }];
  }

  if (cleanSql.startsWith('UPDATE subtasks SET completed = ? WHERE id = ?')) {
    const completed = params[0] ? 1 : 0;
    const id = Number(params[1]);
    const sub = localData.subtasks.find(s => s.id === id);
    if (sub) {
      sub.completed = completed;
      saveLocalStore();
    }
    return [{ affectedRows: 1 }];
  }

  if (cleanSql.startsWith('INSERT INTO task_comments')) {
    const newComm = {
      id: nextId(localData.task_comments),
      task_id: Number(params[0]),
      user_id: Number(params[1]),
      comment: params[2],
      created_at: new Date().toISOString()
    };
    localData.task_comments.push(newComm);
    saveLocalStore();
    return [{ insertId: newComm.id }];
  }

  if (cleanSql.startsWith('INSERT INTO activity_logs')) {
    const newLog = {
      id: nextId(localData.activity_logs),
      user_id: params[0] ? Number(params[0]) : null,
      project_id: params[1] ? Number(params[1]) : null,
      action: params[2],
      details: params[3] || '',
      created_at: new Date().toISOString()
    };
    localData.activity_logs.unshift(newLog); // Put latest on top
    saveLocalStore();
    return [{ insertId: newLog.id }];
  }

  if (cleanSql.includes('FROM activity_logs')) {
    const logs = localData.activity_logs.map(l => {
      const u = localData.users.find(usr => usr.id === l.user_id) || {};
      const p = localData.projects.find(prj => prj.id === l.project_id) || {};
      return {
        ...l,
        user_name: u.name || 'System',
        user_avatar: u.avatar || null,
        project_title: p.title || null
      };
    });
    return [logs.slice(0, 20)];
  }

  // Fallback default
  return [[]];
}

module.exports = db;
