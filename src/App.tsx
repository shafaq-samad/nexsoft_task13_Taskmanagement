import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FolderKanban, 
  Search, 
  SlidersHorizontal, 
  Info, 
  Users, 
  Briefcase, 
  ChevronRight, 
  Lock, 
  FolderPlus,
  Compass
} from 'lucide-react';
import { User, Task, Project, UserRole, TaskStatus } from './types';
import Navbar from './components/Navbar';
import RoleGuide from './components/RoleGuide';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import ProjectModal from './components/ProjectModal';

export default function App() {
  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('ent_jwt_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Team Member');

  // Business Logic State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Control States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Global UX States
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Auto-clear toasts
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
  };

  // Check and reload user session on boot
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          // Token expired or invalid
          handleLogout();
          throw new Error('Session expired');
        }
      })
      .then(user => {
        setCurrentUser(user);
      })
      .catch(err => {
        console.error('Session validation error', err);
      });
    }
  }, [token]);

  // Load projects, tasks, and users once authenticated
  useEffect(() => {
    if (currentUser && token) {
      loadWorkspaceData();
    }
  }, [currentUser, token, selectedProjectId]);

  const loadWorkspaceData = async () => {
    setIsDataLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Get Users
      const usersRes = await fetch('/api/users', { headers });
      const usersData = await usersRes.json();
      if (usersRes.ok) setUsers(usersData);

      // Get Projects
      const projectsRes = await fetch('/api/projects', { headers });
      const projectsData = await projectsRes.json();
      if (projectsRes.ok) setProjects(projectsData);

      // Get Tasks
      let tasksUrl = '/api/tasks';
      if (selectedProjectId !== 'all') {
        tasksUrl += `?projectId=${selectedProjectId}`;
      }
      const tasksRes = await fetch(tasksUrl, { headers });
      const tasksData = await tasksRes.json();
      if (tasksRes.ok) setTasks(tasksData);

    } catch (err) {
      console.error('Error fetching workspace data', err);
      showToast('Error syncing with enterprise workspace server', true);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Trigger quick login preset
  const handleQuickLogin = async (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setIsLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('ent_jwt_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      showToast(`Welcome back, ${data.user.name}! Authenticated as ${data.user.role}.`);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Normal login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAuthError('Please enter email and password.');
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('ent_jwt_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      showToast(`Logged in successfully as ${data.user.role}.`);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Register user submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setAuthError('Please fill out all fields.');
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('ent_jwt_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      showToast(`Account created! Welcomed as ${data.user.role}.`);
      
      // Clear forms
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ent_jwt_token');
    setToken(null);
    setCurrentUser(null);
    setTasks([]);
    setProjects([]);
    setUsers([]);
    setSelectedProjectId('all');
    showToast('Logged out of workspace.');
  };

  // Create Project API request
  const handleCreateProject = async (name: string, description: string) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, description })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to create project');
    }

    setProjects(prev => [...prev, data]);
    setSelectedProjectId(data.id);
    showToast(`Project workspace '${data.name}' successfully provisioned.`);
  };

  // Create or Update Task API request
  const handleSaveTask = async (taskData: Partial<Task>) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    if (editingTask) {
      // Update
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(taskData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      setTasks(prev => prev.map(t => t.id === editingTask.id ? data : t));
      showToast(`Task updated successfully.`);
    } else {
      // Create
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...taskData,
          projectId: taskData.projectId || selectedProjectId
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      setTasks(prev => [...prev, data]);
      showToast(`Task '${data.title}' created successfully.`);
    }
  };

  // Delete Task API request (Admin only)
  const handleDeleteTask = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete task');
    }

    setTasks(prev => prev.filter(t => t.id !== taskId));
    showToast('Task permanently deleted by Admin.');
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Filter tasks based on project select, search input
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const canCreate = currentUser && ['Admin', 'Project Manager'].includes(currentUser.role);

  // Authentication View
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        
        {/* Toast Messages */}
        {toastMessage && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded border text-xs font-bold shadow-lg animate-fade-in flex items-center gap-2 ${
            toastMessage.isError 
              ? 'bg-rose-50 text-rose-800 border-rose-200' 
              : 'bg-slate-900 text-white border-slate-950'
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        )}

        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto h-12 w-12 rounded bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">
            ProManager Enterprise
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 max-w-sm mx-auto font-medium">
            Fine-grained server-authoritative Role-Based Access Control (RBAC)
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-0">
          
          {/* Main Auth Form Container */}
          <div className="bg-white border border-slate-200 rounded-xl p-8 card-shadow lg:col-span-7">
            <div className="flex border-b border-slate-100 pb-4 mb-6 gap-6">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`text-xs font-bold uppercase tracking-wider transition-all pb-4 -mb-[17px] ${
                  authMode === 'login' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`text-xs font-bold uppercase tracking-wider transition-all pb-4 -mb-[17px] ${
                  authMode === 'register' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded">
                {authError}
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="manager@enterprise.com"
                    className="w-full text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-3 py-2.5 bg-white text-slate-800 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-3 py-2.5 bg-white text-slate-800 focus:outline-hidden font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-850 transition-colors disabled:bg-slate-400 cursor-pointer shadow-xs"
                >
                  {isLoading ? 'Verifying Identity...' : 'Access Workspace'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Evelyn Carter"
                    className="w-full text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-3 py-2.5 bg-white text-slate-800 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="evelyn@enterprise.com"
                    className="w-full text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-3 py-2.5 bg-white text-slate-800 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-3 py-2.5 bg-white text-slate-800 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Authorized System Role
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Admin', 'Project Manager', 'Team Member'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegRole(r)}
                        className={`py-2 px-1 rounded text-center border text-[10px] font-bold uppercase tracking-wider transition-all ${
                          regRole === r
                            ? 'bg-slate-100 text-slate-800 border-slate-400'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                        }`}
                      >
                        {r === 'Project Manager' ? 'Manager' : r}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-850 transition-colors disabled:bg-slate-400 cursor-pointer shadow-xs"
                >
                  {isLoading ? 'Creating Identity...' : 'Provision Secure Account'}
                </button>
              </form>
            )}
          </div>

          {/* Quick Login Presets Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 card-shadow flex-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-500" />
                Quick-Login RBAC Presets
              </h3>
              <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">
                Select any preset profile below to automatically verify credential access and log into the environment:
              </p>

              <div className="space-y-3">
                {/* Admin preset */}
                <button
                  onClick={() => handleQuickLogin('admin@enterprise.com', 'admin123')}
                  className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-lg flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Sarah Connor</p>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Admin</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </button>

                {/* PM preset */}
                <button
                  onClick={() => handleQuickLogin('manager@enterprise.com', 'manager123')}
                  className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-lg flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">John Miller</p>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">PM</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </button>

                {/* Member preset 1 */}
                <button
                  onClick={() => handleQuickLogin('member1@enterprise.com', 'member123')}
                  className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-lg flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Alex Rivera</p>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Member (Dev)</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </button>

                {/* Member preset 2 */}
                <button
                  onClick={() => handleQuickLogin('member2@enterprise.com', 'member123')}
                  className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-lg flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Emily Chen</p>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Member (UI/UX)</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </button>
              </div>
            </div>

            {/* Quick explanation of DB structure */}
            <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-center">
              <span className="text-[10px] font-semibold text-slate-500 block leading-relaxed">
                Persistent storage backed by synchronized <strong>db.json</strong> schema configuration.
              </span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Workspace View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />

      {/* Floating Status Toast notification */}
      {toastMessage && (
        <div id="toast" className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded shadow-xl text-xs font-bold animate-fade-in flex items-center gap-2 border ${
          toastMessage.isError 
            ? 'bg-rose-50 text-rose-800 border-rose-200' 
            : 'bg-slate-900 text-white border-slate-950'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
        
        {/* Info header guide */}
        <RoleGuide />

        {/* Project workspace controls & Search header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Left: Project selector */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 shrink-0">
              <Briefcase className="w-5 h-5 text-slate-500" />
            </div>
            
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
              <div className="mb-2 sm:mb-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-1.5">
                  Workspace
                </span>
                <select
                  id="project-selector"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="text-sm font-semibold text-slate-900 focus:outline-hidden bg-transparent border-0 p-0 pr-6 cursor-pointer focus:ring-0 max-w-[200px] truncate"
                >
                  <option value="all">All Projects & Boards</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show project details brief */}
              {selectedProjectId !== 'all' && (
                <div className="text-xs text-slate-400 max-w-md truncate border-l border-slate-200 pl-4 hidden md:block font-medium">
                  {projects.find(p => p.id === selectedProjectId)?.description}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions and search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute top-2.5 left-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search board tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-60 text-xs border border-slate-200 rounded pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Create Project Workspace Button (PM & Admin only) */}
            {canCreate && (
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="px-4 py-2.5 border border-slate-200 hover:border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 rounded bg-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Create a new project workspace container"
              >
                <FolderPlus className="w-4 h-4 text-slate-500" />
                <span>New Project</span>
              </button>
            )}

            {/* Create Task Button (PM & Admin only) */}
            {canCreate ? (
              <button
                id="create-task-btn"
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            ) : (
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded flex items-center gap-1.5 justify-center">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Assignee States Only</span>
              </div>
            )}
          </div>

        </div>

        {/* Task Board Dashboard columns */}
        {isDataLoading && tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2" />
            <p className="text-xs text-slate-400 font-medium">Syncing with workspace database...</p>
          </div>
        ) : (
          <TaskBoard
            tasks={filteredTasks}
            users={users}
            projects={projects}
            currentUser={currentUser}
            onTaskClick={handleOpenEditModal}
          />
        )}
      </main>

      {/* Task Creation & Update Modal Dialog */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={editingTask}
        currentProjectId={selectedProjectId === 'all' ? '' : selectedProjectId}
        projects={projects}
        users={users}
        currentUser={currentUser}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* Project Creation Modal Dialog */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Footnote attribution */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Enterprise Project Hub • Robust Role-Based Access Control System (RBAC) • Powered by JSON Sync DB
        </span>
      </footer>
    </div>
  );
}
