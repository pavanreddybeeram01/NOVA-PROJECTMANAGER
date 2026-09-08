const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const teamRoutes = require('./routes/team');
const statsRoutes = require('./routes/stats');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/stats', statsRoutes);

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'NOVA — Team Productivity Platform',
    version: '1.0.0',
    dbEngine: db.getMode(),
    timestamp: new Date().toISOString()
  });
});

// Serve Static Frontend Client Files
app.use(express.static(path.join(__dirname, '..', 'client')));

// SPA Catch-all Route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'API Endpoint Not Found'
    });
  }

  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);

  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// Start server only when running normally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 NOVA Server is running on http://localhost:${PORT}`);
    console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ Database Engine: ${db.getMode()}`);
  });
}

// Export Express app for Netlify Functions
module.exports = app;
