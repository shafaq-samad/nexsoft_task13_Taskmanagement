import React, { Suspense, lazy, useMemo, useState } from 'react';
import { ChevronRight, Compass, FolderPlus, Info, Briefcase, Lock, Plus, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import TaskBoard from '../components/TaskBoard';
import BoardSkeleton from '../components/BoardSkeleton';
import WorkspaceInsights from '../components/WorkspaceInsights';
import { useActivityFeed } from '../contexts/ActivityContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLookupMaps } from '../hooks/useLookupMaps';
import { useProjects } from '../hooks/useProjects';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useWorkspaceModals } from '../hooks/useWorkspaceModals';
import { ProjectCreateRequest, Task, TaskMutationRequest, UserRole } from '../types';

const TaskModal = lazy(() => import('../components/TaskModal'));
const ProjectModal = lazy(() => import('../components/ProjectModal'));
const RoleGuidePanel = lazy(() => import('../components/RoleGuide'));

const quickLoginProfiles = [
  {
    email: 'admin@enterprise.com',
    password: 'admin123',
    name: 'Sarah Connor',
    role: 'Admin' as const,
    badgeClass: 'text-rose-600 bg-rose-50 border-rose-200',
    badgeLabel: 'Admin',
  },
  {
    email: 'manager@enterprise.com',
    password: 'manager123',
    name: 'John Miller',
    role: 'Project Manager' as const,
    badgeClass: 'text-amber-600 bg-amber-50 border-amber-200',
    badgeLabel: 'Manager',
  },
  {
    email: 'member1@enterprise.com',
    password: 'member123',
    name: 'Alex Rivera',
    role: 'Team Member' as const,
    badgeClass: 'text-blue-600 bg-blue-50 border-blue-200',
    badgeLabel: 'Member (Dev)',
  },
  {
    email: 'member2@enterprise.com',
    password: 'member123',
    name: 'Emily Chen',
    role: 'Team Member' as const,
    badgeClass: 'text-blue-600 bg-blue-50 border-blue-200',
    badgeLabel: 'Member (UI/UX)',
  },
];

function AuthShell({
  authMode,
  setAuthMode,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  regName,
  setRegName,
  regEmail,
  setRegEmail,
  regPassword,
  setRegPassword,
  regRole,
  setRegRole,
  onLogin,
  onRegister,
  onQuickLogin,
  authError,
  isLoading,
}: {
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  regName: string;
  setRegName: (value: string) => void;
  regEmail: string;
  setRegEmail: (value: string) => void;
  regPassword: string;
  setRegPassword: (value: string) => void;
  regRole: UserRole;
  setRegRole: (value: UserRole) => void;
  onLogin: (event: React.FormEvent) => void;
  onRegister: (event: React.FormEvent) => void;
  onQuickLogin: (email: string, password: string) => void;
  authError: string;
  isLoading: boolean;
}) {
  return (
    <main id="main-content" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <a
        href="#auth-panel"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Skip to main content
      </a>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4 sm:px-0">
        <div className="mx-auto h-12 w-12 rounded bg-slate-900 flex items-center justify-center text-white shadow-xs">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">TaskBoard Workspace</h1>
        <p className="mt-1.5 text-xs text-slate-400 max-w-sm mx-auto font-medium">
          Role-aware task management for product teams.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-0">
        <section id="auth-panel" className="bg-white border border-slate-200 rounded-xl p-8 card-shadow lg:col-span-7">
          <div className="flex border-b border-slate-100 pb-4 mb-6 gap-6">
            <button
              onClick={() => { setAuthMode('login'); }}
              className={`text-xs font-bold uppercase tracking-wider transition-all pb-4 -mb-[17px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                authMode === 'login' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); }}
              className={`text-xs font-bold uppercase tracking-wider transition-all pb-4 -mb-[17px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                authMode === 'register' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded" role="alert">
              {authError}
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="login-email">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="manager@enterprise.com"
                  className="w-full text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-3 py-2.5 bg-white text-slate-800 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-3 py-2.5 bg-white text-slate-800 focus:outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {isLoading ? 'Signing in...' : 'Access Workspace'}
              </button>
            </form>
          ) : (
            <form onSubmit={onRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="register-name">
                  Full Name
                </label>
                <input
                  id="register-name"
                  type="text"
                  required
                  value={regName}
                  onChange={(event) => setRegName(event.target.value)}
                  placeholder="Evelyn Carter"
                  className="w-full text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-3 py-2.5 bg-white text-slate-800 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="register-email">
                  Email Address
                </label>
                <input
                  id="register-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(event) => setRegEmail(event.target.value)}
                  placeholder="evelyn@enterprise.com"
                  className="w-full text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-3 py-2.5 bg-white text-slate-800 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="register-password">
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  required
                  value={regPassword}
                  onChange={(event) => setRegPassword(event.target.value)}
                  placeholder="Create a password"
                  className="w-full text-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded px-3 py-2.5 bg-white text-slate-800 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Authorized System Role
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Admin', 'Project Manager', 'Team Member'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRegRole(role)}
                      className={`py-2 px-1 rounded text-center border text-[10px] font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                        regRole === role
                          ? 'bg-slate-100 text-slate-800 border-slate-400'
                          : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                      }`}
                    >
                      {role === 'Project Manager' ? 'Manager' : role}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </section>

        <aside className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 card-shadow flex-1">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-500" />
              Quick sign-in profiles
            </h2>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">
              Use one of the built-in demo accounts to explore permission states and task workflows.
            </p>

            <div className="space-y-3">
              {quickLoginProfiles.map((profile) => (
                <button
                  key={profile.email}
                  onClick={() => onQuickLogin(profile.email, profile.password)}
                  className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-lg flex items-center justify-between transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`/avatars/${profile.role === 'Admin' ? 'admin' : profile.role === 'Project Manager' ? 'manager' : profile.email.includes('member1') ? 'member-1' : 'member-2'}.svg`}
                      alt={`${profile.name} avatar`}
                      loading="lazy"
                      decoding="async"
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{profile.name}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${profile.badgeClass}`}>
                        {profile.badgeLabel}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </button>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </main>
  );
}

export default function WorkspacePage() {
  const { user, isLoading: isAuthLoading, isSubmitting: isAuthSubmitting, login, register, logout, canCreateContent, authError } = useAuth();
  const { showToast } = useToast();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Team Member');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { users } = useUsers();
  const { projects, createProject, isLoading: isProjectsLoading } = useProjects();
  const { tasks, isLoading: isTasksLoading, createTask, updateTask, moveTaskToStatus, deleteTask } = useTasks(selectedProjectId);
  const { projectsById } = useLookupMaps(users, projects);
  const { isTaskModalOpen, isProjectModalOpen, editingTask, openCreateTask, openEditTask, closeTaskModal, openProjectModal, closeProjectModal } = useWorkspaceModals();
  const filteredTasks = useTaskFilters(tasks, searchQuery, selectedProjectId);
  const { entries: activityEntries } = useActivityFeed();

  const selectedProjectDescription = useMemo(() => {
    if (selectedProjectId === 'all') {
      return '';
    }

    return projectsById.get(selectedProjectId)?.description ?? '';
  }, [projectsById, selectedProjectId]);

  const currentUser = user;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await login({ email: loginEmail, password: loginPassword });
      showToast(`Logged in as ${loginEmail}.`);
    } catch {
      // AuthContext surfaces the error message for the form.
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await register({ name: regName, email: regEmail, password: regPassword, role: regRole });
      showToast(`Account created for ${regName}.`);
      setRegName('');
      setRegEmail('');
      setRegPassword('');
    } catch {
      // AuthContext surfaces the error message for the form.
    }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setLoginEmail(email);
    setLoginPassword(password);
    try {
      await login({ email, password });
      showToast(`Signed in as ${email}.`);
    } catch {
      // AuthContext surfaces the error message for the form.
    }
  };

  const handleLogout = () => {
    logout();
    setSelectedProjectId('all');
    setSearchQuery('');
    showToast('Logged out of workspace.');
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    const payload: TaskMutationRequest = taskData;
    if (editingTask) {
      await updateTask(editingTask.id, payload);
    } else {
      await createTask({
        ...payload,
        projectId: payload.projectId || selectedProjectId,
      });
    }
  };

  const handleCreateProject = async (name: string, description: string) => {
    await createProject({ name, description } satisfies ProjectCreateRequest);
    setSelectedProjectId('all');
  };

  if (!currentUser && isAuthLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
          Restoring session...
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <AuthShell
        authMode={authMode}
        setAuthMode={setAuthMode}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        regName={regName}
        setRegName={setRegName}
        regEmail={regEmail}
        setRegEmail={setRegEmail}
        regPassword={regPassword}
        setRegPassword={setRegPassword}
        regRole={regRole}
        setRegRole={setRegRole}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onQuickLogin={handleQuickLogin}
        authError={authError}
        isLoading={isAuthSubmitting}
      />
    );
  }

  const isBoardLoading = (isTasksLoading || isProjectsLoading) && tasks.length === 0;

  return (
    <main id="main-content" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <a
        href="#workspace-controls"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Skip to workspace controls
      </a>

      <Navbar currentUser={currentUser} onLogout={handleLogout} />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        <Suspense fallback={<div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading guidance...</div>}>
          <RoleGuidePanel />
        </Suspense>

        <WorkspaceInsights
          tasks={tasks}
          projects={projects}
          users={users}
          activityEntries={activityEntries}
        />

        <section id="workspace-controls" className="bg-white rounded-xl border border-slate-200 p-5 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="text-sm font-semibold text-slate-900 focus:outline-none bg-transparent border-0 p-0 pr-6 cursor-pointer focus:ring-2 focus:ring-indigo-500/20 max-w-[220px] truncate"
                >
                  <option value="all">All Projects & Boards</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProjectId !== 'all' && selectedProjectDescription && (
                <div className="text-xs text-slate-400 max-w-md truncate border-l border-slate-200 pl-4 hidden md:block font-medium">
                  {selectedProjectDescription}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <span className="absolute top-2.5 left-3 text-slate-400" aria-hidden="true">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search board tasks..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full sm:w-60 text-xs border border-slate-200 rounded pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
              />
            </div>

            {canCreateContent && (
              <button
                onClick={openProjectModal}
                className="px-4 py-2.5 border border-slate-200 hover:border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 rounded bg-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                title="Create a new project workspace"
              >
                <FolderPlus className="w-4 h-4 text-slate-500" />
                <span>New Project</span>
              </button>
            )}

            {canCreateContent ? (
              <button
                id="create-task-btn"
                onClick={openCreateTask}
                className="px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            ) : (
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded flex items-center gap-1.5 justify-center">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>View only</span>
              </div>
            )}
          </div>
        </section>

        {isBoardLoading ? (
          <BoardSkeleton />
        ) : (
          <TaskBoard
            tasks={filteredTasks}
            users={users}
            projects={projects}
            currentUser={currentUser}
            onTaskClick={openEditTask}
            onTaskMove={moveTaskToStatus}
          />
        )}
      </div>

      {currentUser && (
        <Suspense fallback={null}>
          <TaskModal
            isOpen={isTaskModalOpen}
            onClose={closeTaskModal}
            task={editingTask}
            currentProjectId={selectedProjectId === 'all' ? '' : selectedProjectId}
            projects={projects}
            users={users}
            currentUser={currentUser}
            onSave={handleSaveTask}
            onDelete={deleteTask}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={closeProjectModal}
          onCreateProject={handleCreateProject}
        />
      </Suspense>

      <footer className="py-8 bg-white border-t border-slate-200 text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          TaskBoard Workspace • Role-aware project delivery system
        </span>
      </footer>
    </main>
  );
}
