const { useState, useEffect } = React;
const API_BASE = 'https://nova-projectmanager.onrender.com';

const originalFetch = window.fetch;

window.fetch = (url, options) => {
  if (typeof url === 'string' && url.startsWith('/api/')) {
    url = `${API_BASE}${url}`;
  }
  return originalFetch(url, options);
};

const INITIAL_TEAM = [
  { id: 1, name: 'Elena Rostova', role: 'Admin', title: 'Product Strategist & Admin', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: 2, name: 'Alex Chen', role: 'Manager', title: 'Lead Full-Stack Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { id: 3, name: 'Sarah Jenkins', role: 'Member', title: 'Senior UI/UX Designer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  { id: 4, name: 'David Miller', role: 'Member', title: 'DevOps & Cloud Specialist', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
];

// Main App Component
function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nova_token') || '');
  const [activeProjectFilter, setActiveProjectFilter] = useState(null);

  // Application Data States
  const [stats, setStats] = useState({
    totalProjects: 3,
    totalTasks: 6,
    completedTasks: 2,
    inProgressTasks: 2,
    completionRate: 33,
    totalMembers: 4,
    dbEngine: 'MySQL/Local'
  });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [recentActivity, setRecentActivity] = useState([]);
  const [projectProgressList, setProjectProgressList] = useState([]);

  // UI Modal & Form States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Auth Inputs
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'Member' });
  const [authError, setAuthError] = useState('');

  // Form Inputs for New Project
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: 'Engineering',
    color: '#6366f1',
    budget: 25000,
    end_date: '2026-11-30'
  });

  // Form Inputs for New Task
  const [newTask, setNewTask] = useState({
    project_id: '',
    title: '',
    description: '',
    priority: 'Medium',
    status: 'todo',
    assignee_id: '',
    due_date: '2026-09-30'
  });

  const [commentInput, setCommentInput] = useState('');

  // Helper Toast trigger
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check initial login token on boot
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Fetch Data when view changes or logged in
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, currentView]);

  // Re-initialize Lucide Icons after render
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  // API Call Helpers
  const API_BASE = 'https://nova-projectmanager.onrender.com';
  
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/me', { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        if (currentView === 'landing' || currentView === 'login') {
          setCurrentView('dashboard');
        }
      } else {
        localStorage.removeItem('nova_token');
        setToken('');
      }
    } catch (err) {
      console.warn('API unavailable, running offline presentation mode.');
    }
  };

  const loadAllData = async () => {
    try {
      // Stats Overview
      const resStats = await fetch('/api/stats/overview', { headers: getHeaders() });
      const dataStats = await resStats.json();
      if (dataStats.success) {
        setStats(dataStats.stats);
        setRecentActivity(dataStats.recentActivity || []);
        setProjectProgressList(dataStats.projectProgress || []);
      }

      // Projects
      const resProjects = await fetch('/api/projects', { headers: getHeaders() });
      const dataProjects = await resProjects.json();
      if (dataProjects.success) {
        setProjects(dataProjects.projects);
      }

      // Tasks
      const resTasks = await fetch('/api/tasks', { headers: getHeaders() });
      const dataTasks = await resTasks.json();
      if (dataTasks.success) {
        setTasks(dataTasks.tasks);
      }

      // Team
      const resTeam = await fetch('/api/team', { headers: getHeaders() });
      const dataTeam = await resTeam.json();
      if (dataTeam.success) {
        setTeam(dataTeam.members);
      }
    } catch (err) {
      console.warn('Error loading remote data:', err);
    }
  };

  // Handle Standard Login Submit
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('nova_token', data.token);
        setUser(data.user);
        setCurrentView('dashboard');
        showToast(`Welcome back, ${data.user.name}!`);
      } else {
        setAuthError(data.message || 'Login failed.');
      }
    } catch (err) {
      setAuthError('Connection error. Is backend server running?');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('nova_token', data.token);
        setUser(data.user);
        setCurrentView('dashboard');
        showToast(`Account created! Welcome to NOVA, ${data.user.name}.`);
      } else {
        setAuthError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setAuthError('Failed to register. Please check server.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('nova_token');
    setCurrentView('landing');
    showToast('Logged out successfully.');
  };

  // Create Project Action
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newProject)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Project "${newProject.title}" created successfully!`);
        setShowProjectModal(false);
        setNewProject({ title: '', description: '', category: 'Engineering', color: '#6366f1', budget: 25000, end_date: '2026-11-30' });
        loadAllData();
      }
    } catch (err) {
      showToast('Error creating project.');
    }
  };

  // Create Task Action
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.project_id || !newTask.title) {
      showToast('Please select a project and enter task title.');
      return;
    }
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newTask)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Task "${newTask.title}" added to board.`);
        setShowTaskModal(false);
        setNewTask({ project_id: '', title: '', description: '', priority: 'Medium', status: 'todo', assignee_id: '', due_date: '2026-09-30' });
        loadAllData();
      }
    } catch (err) {
      showToast('Error creating task.');
    }
  };

  // Move Kanban Task Status
  const handleMoveTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Task moved to ${newStatus.toUpperCase().replace('_', ' ')}`);
        loadAllData();
      }
    } catch (err) {
      showToast('Failed to update task status.');
    }
  };

  // Assign Task to Team Member
  const handleAssignTask = async (taskId, assigneeId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ assignee_id: assigneeId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        loadAllData();
        if (selectedTask && selectedTask.id === taskId) {
          const assignedMember = team.find(m => m.id === Number(assigneeId));
          setSelectedTask({
            ...selectedTask,
            assignee_id: assigneeId ? Number(assigneeId) : null,
            assignee_name: assignedMember ? assignedMember.name : null,
            assignee_avatar: assignedMember ? assignedMember.avatar : null
          });
        }
      }
    } catch (err) {
      showToast('Failed to reassign task.');
    }
  };

  // Add Comment to Task
  const handleAddComment = async (taskId) => {
    if (!commentInput.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ comment: commentInput })
      });
      const data = await res.json();
      if (data.success) {
        setCommentInput('');
        showToast('Comment posted.');
        loadAllData();
        // Refresh selected modal task details
        const updatedTasks = tasks.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              comments: [...(t.comments || []), { id: Date.now(), user_name: user.name, user_avatar: user.avatar, comment: commentInput, created_at: new Date().toISOString() }]
            };
          }
          return t;
        });
        setTasks(updatedTasks);
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask({
            ...selectedTask,
            comments: [...(selectedTask.comments || []), { id: Date.now(), user_name: user.name, user_avatar: user.avatar, comment: commentInput, created_at: new Date().toISOString() }]
          });
        }
      }
    } catch (err) {
      showToast('Error posting comment.');
    }
  };

  // Dynamic filter for active project in Kanban
  const filteredTasks = activeProjectFilter
    ? tasks.filter(t => t.project_id === activeProjectFilter)
    : tasks;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      {user && (
        <aside className="sidebar">
          <div className="brand-logo" onClick={() => setCurrentView('dashboard')} style={{ cursor: 'pointer' }}>
            <div className="brand-icon">
              <i data-lucide="sparkles" style={{ color: '#fff' }}></i>
            </div>
            <span className="brand-title">NOVA</span>
          </div>

          <nav className="nav-menu">
            <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
              <i data-lucide="layout-dashboard"></i>
              <span className="nav-text">Dashboard</span>
            </div>
            <div className={`nav-item ${currentView === 'projects' ? 'active' : ''}`} onClick={() => setCurrentView('projects')}>
              <i data-lucide="folder-kanban"></i>
              <span className="nav-text">Projects</span>
            </div>
            <div className={`nav-item ${currentView === 'kanban' ? 'active' : ''}`} onClick={() => setCurrentView('kanban')}>
              <i data-lucide="trello"></i>
              <span className="nav-text">Task Board</span>
            </div>
            <div className={`nav-item ${currentView === 'team' ? 'active' : ''}`} onClick={() => setCurrentView('team')}>
              <i data-lucide="users"></i>
              <span className="nav-text">Team</span>
            </div>
            <div className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`} onClick={() => setCurrentView('analytics')}>
              <i data-lucide="bar-chart-3"></i>
              <span className="nav-text">Analytics</span>
            </div>
          </nav>

          <div style={{ padding: '1rem 0.5rem', borderTop: '1px solid var(--border-glass)' }}>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
              <i data-lucide="log-out"></i>
              <span className="nav-text">Sign Out</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main View Area */}
      <main className={user ? "main-content" : "main-content-full"} style={!user ? { marginLeft: 0, padding: '2rem 4rem' } : {}}>
        
        {/* Top Header Bar */}
        {user && (
          <header className="header-bar">
            <div className="header-title-group">
              <h1>
                {currentView === 'dashboard' && 'Workspace Dashboard'}
                {currentView === 'projects' && 'Projects Hub'}
                {currentView === 'kanban' && 'Kanban Task Board'}
                {currentView === 'team' && 'Team Collaboration'}
                {currentView === 'analytics' && 'Progress & Performance'}
              </h1>
              <p>Plan. Collaborate. Deliver.</p>
            </div>

            <div className="header-user-profile">
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
                <i data-lucide="plus"></i> New Task
              </button>
              <div className="user-badge">
                <img src={user.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"} className="avatar-img" alt={user.name} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
                  <span className={`role-pill role-${user.role.toLowerCase()}`}>{user.role}</span>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* VIEW 1: LANDING PAGE */}
        {currentView === 'landing' && (
          <div className="landing-hero">
            <div className="landing-tagline">
              <i data-lucide="sparkles" style={{ width: 14, height: 14, display: 'inline', marginRight: 6 }}></i>
              NOVA Team Productivity Platform
            </div>
            <h1 className="hero-title">Plan. Collaborate. Deliver.</h1>
            <p className="hero-subtitle">
              The next-generation project management workspace for high-velocity teams. Track projects, organize Kanban tasks, assign responsibilities, and analyze real-time completion analytics.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3.5rem' }}>
              <button className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }} onClick={() => setCurrentView('register')}>
                <i data-lucide="sparkles"></i> Get Started
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }} onClick={() => setCurrentView('login')}>
                Sign In
              </button>
            </div>

            {/* Feature Cards Showcase */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', marginBottom: '1rem' }}>
                  <i data-lucide="folder-kanban"></i>
                </div>
                <h3>Project Control Hub</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Create and manage projects with custom status tags, budgets, timelines, and member permissions.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', marginBottom: '1rem' }}>
                  <i data-lucide="trello"></i>
                </div>
                <h3>Interactive Kanban Board</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Visual task columns (To Do, In Progress, Review, Completed) with instant drag-and-drop state updates.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', marginBottom: '1rem' }}>
                  <i data-lucide="users"></i>
                </div>
                <h3>Team Collaboration</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Assign team members, comment on tasks, manage subtasks checklists, and maintain activity logs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LOGIN & REGISTER */}
        {(currentView === 'login' || currentView === 'register') && !user && (
          <div style={{ maxWidth: 450, margin: '3rem auto', width: '100%' }}>
            <div className="glass-card" style={{ padding: '2.25rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div className="brand-icon" style={{ margin: '0 auto 1rem auto' }}>
                  <i data-lucide="sparkles" style={{ color: '#fff' }}></i>
                </div>
                <h2>{currentView === 'login' ? 'Sign In to NOVA' : 'Create Account'}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Plan. Collaborate. Deliver.</p>
              </div>

              {authError && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f87171', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {authError}
                </div>
              )}

              {currentView === 'login' ? (
                <form onSubmit={handleLoginSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Email Address</label>
                    <input className="input-field" type="email" placeholder="admin@nova.io" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Password</label>
                    <input className="input-field" type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} type="submit">Sign In</button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Full Name</label>
                    <input className="input-field" type="text" placeholder="John Doe" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} required />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Email Address</label>
                    <input className="input-field" type="email" placeholder="john@nova.io" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Password</label>
                    <input className="input-field" type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Role</label>
                    <select className="input-field" value={authForm.role} onChange={e => setAuthForm({ ...authForm, role: e.target.value })}>
                      <option value="Member">Team Member</option>
                      <option value="Manager">Project Manager</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} type="submit">Create Account</button>
                </form>
              )}

              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {currentView === 'login' ? (
                  <span>Don't have an account? <a href="#" onClick={() => setCurrentView('register')}>Register here</a></span>
                ) : (
                  <span>Already registered? <a href="#" onClick={() => setCurrentView('login')}>Sign in</a></span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DASHBOARD */}
        {currentView === 'dashboard' && user && (
          <div>
            {/* Metric Overview Widgets */}
            <div className="stats-grid">
              <div className="glass-card stat-card">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <i data-lucide="folder-kanban"></i>
                </div>
                <div>
                  <div className="stat-value">{stats.totalProjects}</div>
                  <div className="stat-label">Active Projects</div>
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <i data-lucide="check-circle-2"></i>
                </div>
                <div>
                  <div className="stat-value">{stats.completedTasks} / {stats.totalTasks}</div>
                  <div className="stat-label">Tasks Completed</div>
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
                  <i data-lucide="percent"></i>
                </div>
                <div>
                  <div className="stat-value">{stats.completionRate}%</div>
                  <div className="stat-label">Overall Completion Rate</div>
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                  <i data-lucide="users"></i>
                </div>
                <div>
                  <div className="stat-value">{stats.totalMembers}</div>
                  <div className="stat-label">Team Contributors</div>
                </div>
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              {/* Left Column: Project Progress Breakdown */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3>Project Progress Overview</h3>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setShowProjectModal(true)}>
                    <i data-lucide="plus"></i> New Project
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {projectProgressList.map(proj => (
                    <div key={proj.id} style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: proj.color }}></span>
                          <span style={{ fontWeight: 600, fontSize: '0.98rem' }}>{proj.title}</span>
                          <span className="role-pill role-manager">{proj.category}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: proj.color }}>{proj.progress}%</span>
                      </div>
                      <div className="progress-bar-bg" style={{ height: 8 }}>
                        <div className="progress-bar-fill" style={{ width: `${proj.progress}%`, background: proj.color }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Status: <strong>{proj.status}</strong></span>
                        <span>{proj.completedTasks} of {proj.totalTasks} tasks done</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Live Activity Feed */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.25rem' }}>Recent Activity Feed</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recentActivity.slice(0, 7).map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                      <img src={item.user_avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"} style={{ width: 30, height: 30, borderRadius: '50%' }} alt="" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.action}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{item.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: PROJECTS MANAGEMENT */}
        {currentView === 'projects' && user && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Active Projects ({projects.length})</h2>
              <button className="btn btn-primary" onClick={() => setShowProjectModal(true)}>
                <i data-lucide="plus"></i> Add New Project
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {projects.map(proj => {
                const projTasks = tasks.filter(t => t.project_id === proj.id);
                const completedCount = projTasks.filter(t => t.status === 'completed').length;
                const progressPct = projTasks.length > 0 ? Math.round((completedCount / projTasks.length) * 100) : 0;

                return (
                  <div key={proj.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 20, background: 'rgba(255, 255, 255, 0.08)', fontWeight: 600 }}>
                          {proj.category}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: proj.color, fontWeight: 700, textTransform: 'uppercase' }}>
                          ● {proj.status}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{proj.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                        {proj.description || 'No description provided.'}
                      </p>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                          <span style={{ fontWeight: 700 }}>{progressPct}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${progressPct}%`, background: proj.color }}></div>
                        </div>
                      </div>
                    </div>

                    <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Budget: <strong>${Number(proj.budget).toLocaleString()}</strong>
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }} onClick={() => { setActiveProjectFilter(proj.id); setCurrentView('kanban'); }}>
                        View Board <i data-lucide="arrow-right"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 5: KANBAN TASK BOARD */}
        {currentView === 'kanban' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Filter by Project:</span>
                <select className="input-field" style={{ width: 220, padding: '0.45rem 0.85rem', fontSize: '0.85rem' }} value={activeProjectFilter || ''} onChange={e => setActiveProjectFilter(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
                <i data-lucide="plus"></i> Add New Task
              </button>
            </div>

            {/* 4-COLUMN KANBAN BOARD */}
            <div className="kanban-board">
              {[
                { key: 'todo', title: 'To Do', icon: 'circle', color: '#9ca3af' },
                { key: 'in_progress', title: 'In Progress', icon: 'clock', color: '#6366f1' },
                { key: 'in_review', title: 'Under Review', icon: 'eye', color: '#f59e0b' },
                { key: 'completed', title: 'Completed', icon: 'check-circle-2', color: '#10b981' }
              ].map(col => {
                const columnTasks = filteredTasks.filter(t => t.status === col.key);

                return (
                  <div key={col.key} className="kanban-column">
                    <div className="column-header">
                      <div className="column-title-group">
                        <i data-lucide={col.icon} style={{ color: col.color, width: 18, height: 18 }}></i>
                        <h4 style={{ fontSize: '0.95rem' }}>{col.title}</h4>
                      </div>
                      <span className="column-badge">{columnTasks.length}</span>
                    </div>

                    <div className="task-list">
                      {columnTasks.map(task => (
                        <div key={task.id} className="task-card" onClick={() => setSelectedTask(task)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className={`priority-pill priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                            {task.due_date && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                <i data-lucide="calendar" style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }}></i>
                                {task.due_date}
                              </span>
                            )}
                          </div>

                          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem' }}>{task.title}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {task.description || 'No additional details.'}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-glass)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <img src={task.assignee_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} style={{ width: 24, height: 24, borderRadius: '50%' }} title={task.assignee_name || 'Unassigned'} alt="" />
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.assignee_name ? task.assignee_name.split(' ')[0] : 'Unassigned'}</span>
                            </div>

                            {/* Move Column Actions */}
                            <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                              {col.key !== 'todo' && (
                                <button className="btn btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} title="Move left" onClick={() => handleMoveTaskStatus(task.id, col.key === 'completed' ? 'in_review' : col.key === 'in_review' ? 'in_progress' : 'todo')}>
                                  ←
                                </button>
                              )}
                              {col.key !== 'completed' && (
                                <button className="btn btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} title="Move right" onClick={() => handleMoveTaskStatus(task.id, col.key === 'todo' ? 'in_progress' : col.key === 'in_progress' ? 'in_review' : 'completed')}>
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 6: TEAM DIRECTORY */}
        {currentView === 'team' && user && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Team Roster ({team.length})</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {team.map(member => (
                <div key={member.id} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <img src={member.avatar} style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid var(--primary)', marginBottom: '0.75rem', objectFit: 'cover' }} alt="" />
                  <h3 style={{ fontSize: '1.1rem' }}>{member.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{member.title || 'Contributor'}</p>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <span className={`role-pill role-${member.role.toLowerCase()}`}>{member.role}</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                    <i data-lucide="mail" style={{ width: 14, height: 14, display: 'inline', marginRight: 5 }}></i>
                    {member.email}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 7: ANALYTICS & PROGRESS */}
        {currentView === 'analytics' && user && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Performance & Task Metrics</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Task Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                      <span>To Do</span>
                      <strong>{stats.todoTasks || 0} tasks</strong>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${stats.totalTasks ? (stats.todoTasks / stats.totalTasks) * 100 : 0}%`, background: '#9ca3af' }}></div></div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                      <span>In Progress</span>
                      <strong>{stats.inProgressTasks || 0} tasks</strong>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${stats.totalTasks ? (stats.inProgressTasks / stats.totalTasks) * 100 : 0}%`, background: '#6366f1' }}></div></div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                      <span>Completed</span>
                      <strong>{stats.completedTasks || 0} tasks</strong>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${stats.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`, background: '#10b981' }}></div></div>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.completionRate}%</div>
                <h3>Sprint Velocity Rate</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Calculated based on active task states across all registered workspace projects.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* CREATE PROJECT MODAL */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Project Title</label>
                <input className="input-field" type="text" placeholder="e.g., NOVA Mobile App 2.0" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Description</label>
                <textarea className="input-field" rows="3" placeholder="Project objectives and overview..." value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })}></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Category</label>
                  <select className="input-field" value={newProject.category} onChange={e => setNewProject({ ...newProject, category: e.target.value })}>
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Budget ($)</label>
                  <input className="input-field" type="number" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: Number(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem' }}>Add New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Target Project</label>
                <select className="input-field" value={newTask.project_id} onChange={e => setNewTask({ ...newTask, project_id: Number(e.target.value) })} required>
                  <option value="">Select Project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Task Title</label>
                <input className="input-field" type="text" placeholder="e.g., Design Figma wireframes" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Description</label>
                <textarea className="input-field" rows="2" placeholder="Task specifics..." value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Priority</label>
                  <select className="input-field" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Assignee</label>
                  <select className="input-field" value={newTask.assignee_id} onChange={e => setNewTask({ ...newTask, assignee_id: Number(e.target.value) })}>
                    <option value="">Unassigned</option>
                    {(team && team.length > 0 ? team : INITIAL_TEAM).map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.title || m.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAILS & COMMENTS DRAWER MODAL */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className={`priority-pill priority-${selectedTask.priority.toLowerCase()}`}>{selectedTask.priority}</span>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setSelectedTask(null)}>✕</button>
            </div>

            <h2 style={{ marginBottom: '0.5rem' }}>{selectedTask.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {selectedTask.description || 'No description available.'}
            </p>

            {/* ASSIGNEE SELECTOR & RE-ASSIGNMENT */}
            <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, border: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                👤 Assigned Team Member
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={selectedTask.assignee_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--primary)' }} alt="" />
                <select className="input-field" style={{ flex: 1, padding: '0.5rem 0.85rem' }} value={selectedTask.assignee_id || ''} onChange={e => handleAssignTask(selectedTask.id, e.target.value)}>
                  <option value="">Unassigned</option>
                  {(team && team.length > 0 ? team : INITIAL_TEAM).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.title || m.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task Comments Section */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '1rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Discussion & Comments</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: 180, overflowY: 'auto' }}>
                {(selectedTask.comments || []).map((c, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 8, fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600, color: '#a5b4fc', marginBottom: '0.2rem' }}>{c.user_name}</div>
                    <div>{c.comment}</div>
                  </div>
                ))}
                {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No comments yet. Start the discussion below.</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input-field" placeholder="Write a comment..." value={commentInput} onChange={e => setCommentInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment(selectedTask.id)} />
                <button className="btn btn-primary" onClick={() => handleAddComment(selectedTask.id)}>Post</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION POPUP */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid var(--primary)',
          color: '#fff',
          padding: '0.85rem 1.5rem',
          borderRadius: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          zIndex: 1000,
          fontWeight: 500,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <i data-lucide="check-circle" style={{ color: 'var(--accent-emerald)', width: 18, height: 18 }}></i>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// Render React Root
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
