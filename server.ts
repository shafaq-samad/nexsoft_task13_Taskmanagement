import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db';
import { authenticateToken, requireRole, JWT_SECRET, AuthenticatedRequest } from './src/server/middleware';
import { Task, UserRole, TaskStatus, TaskPriority } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global parsing middleware
  app.use(express.json());

  // Log requests in dev mode
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  /**
   * Register a new user
   */
  app.post('/api/auth/register', (req, res) => {
    const { email, password, name, role, avatarUrl } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required.' });
      return;
    }

    const users = db.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: 'A user with this email already exists.' });
      return;
    }

    // Set a safe user role (defaulting to Team Member, unless a valid role is specified)
    let assignedRole: UserRole = 'Team Member';
    if (role && ['Admin', 'Project Manager', 'Team Member'].includes(role)) {
      assignedRole = role as UserRole;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const id = `user-${Date.now()}`;

    const newUser = {
      id,
      email: email.toLowerCase(),
      name,
      role: assignedRole,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    };

    db.addUser({ ...newUser, passwordHash });

    const token = jwt.sign({ userId: id, role: assignedRole }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: newUser
    });
  });

  /**
   * Login user
   */
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const { passwordHash, ...safeUser } = user;

    res.json({
      token,
      user: safeUser
    });
  });

  /**
   * Get current user details (using token)
   */
  app.get('/api/auth/me', authenticateToken, (req: express.Request, res: express.Response) => {
    const authReq = req as AuthenticatedRequest;
    res.json(authReq.user);
  });


  // ==========================================
  // USERS & PROJECTS ENDPOINTS (Protected)
  // ==========================================

  /**
   * List all system users (useful for assignees list)
   */
  app.get('/api/users', authenticateToken, (req, res) => {
    const users = db.getUsers().map(({ passwordHash, ...safeUser }) => safeUser);
    res.json(users);
  });

  /**
   * List all projects
   */
  app.get('/api/projects', authenticateToken, (req, res) => {
    res.json(db.getProjects());
  });

  /**
   * Create a new project (Admin or Project Manager only)
   */
  app.post('/api/projects', authenticateToken, requireRole(['Admin', 'Project Manager']), (req, res) => {
    const { name, description } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!name) {
      res.status(400).json({ error: 'Project name is required.' });
      return;
    }

    const newProject = {
      id: `proj-${Date.now()}`,
      name,
      description: description || '',
      managerId: authReq.user?.id || null
    };

    db.addProject(newProject);
    res.status(201).json(newProject);
  });


  // ==========================================
  // TASK CRUD & STATE MACHINE ENDPOINTS (Protected)
  // ==========================================

  /**
   * GET /api/tasks - List all tasks, optional filtering by project or assignee
   */
  app.get('/api/tasks', authenticateToken, (req, res) => {
    const { projectId, assigneeId } = req.query;
    let tasks = db.getTasks();

    if (projectId) {
      tasks = tasks.filter(t => t.projectId === projectId);
    }
    if (assigneeId) {
      tasks = tasks.filter(t => t.assigneeId === assigneeId);
    }

    res.json(tasks);
  });

  /**
   * POST /api/tasks - Create a new task (Admin or Project Manager only)
   */
  app.post('/api/tasks', authenticateToken, requireRole(['Admin', 'Project Manager']), (req, res) => {
    const { title, description, status, priority, dueDate, assigneeId, projectId } = req.body;

    if (!title || !projectId) {
      res.status(400).json({ error: 'Title and Project ID are required.' });
      return;
    }

    // Validate Project
    const projects = db.getProjects();
    if (!projects.some(p => p.id === projectId)) {
      res.status(400).json({ error: 'The specified Project ID does not exist.' });
      return;
    }

    // Validate Assignee if provided
    if (assigneeId) {
      const users = db.getUsers();
      if (!users.some(u => u.id === assigneeId)) {
        res.status(400).json({ error: 'The specified Assignee ID does not exist.' });
        return;
      }
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      description: description || '',
      status: (status as TaskStatus) || 'Todo',
      priority: (priority as TaskPriority) || 'Medium',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assigneeId: assigneeId || null,
      projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const savedTask = db.addTask(newTask);
    res.status(201).json(savedTask);
  });

  /**
   * PUT /api/tasks/:id - Update an existing task (Fine-grained RBAC State Machine validation)
   */
  app.put('/api/tasks/:id', authenticateToken, (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const currentUser = authReq.user!;
    const body = req.body;

    const tasks = db.getTasks();
    const existingTask = tasks.find(t => t.id === id);

    if (!existingTask) {
      res.status(404).json({ error: `Task with ID ${id} not found.` });
      return;
    }

    // RBAC Task Mutation Checking:
    if (currentUser.role === 'Admin') {
      // Admin has complete clearance
      const updated = db.updateTask(id, body);
      res.json(updated);
      return;
    }

    if (currentUser.role === 'Project Manager') {
      // Project Manager can update all aspects of tasks (but delete is a separate endpoint)
      // Filter out any restricted fields if needed, but in standard enterprise apps PM can edit anything on a task.
      const updated = db.updateTask(id, body);
      res.json(updated);
      return;
    }

    if (currentUser.role === 'Team Member') {
      // Team Members are strictly constrained:
      // 1. Can only edit status
      // 2. Can only edit status if assigned to them

      // Check if task is assigned to this member
      if (existingTask.assigneeId !== currentUser.id) {
        res.status(403).json({
          error: `Permission Denied: Team Members can only update tasks assigned to themselves. This task is assigned to '${existingTask.assigneeId || 'Unassigned'}'.`
        });
        return;
      }

      // Check if they are trying to edit fields other than 'status'
      const requestedKeys = Object.keys(body);
      const invalidKeys = requestedKeys.filter(key => key !== 'status');

      if (invalidKeys.length > 0) {
        res.status(403).json({
          error: `Permission Denied: As a Team Member, you are only authorized to update the task 'status'. You are not allowed to mutate fields: [${invalidKeys.join(', ')}]`
        });
        return;
      }

      // Check if status is a valid task state
      if (body.status && !['Todo', 'In Progress', 'Review', 'Done'].includes(body.status)) {
        res.status(400).json({ error: 'Invalid task status. Must be one of: Todo, In Progress, Review, Done.' });
        return;
      }

      // All checks passed! Mutate only status.
      const updated = db.updateTask(id, { status: body.status as TaskStatus });
      res.json(updated);
      return;
    }

    res.status(403).json({ error: 'Unknown system role. Unauthorized.' });
  });

  /**
   * DELETE /api/tasks/:id - Delete a task (Strictly Admin only)
   */
  app.delete('/api/tasks/:id', authenticateToken, requireRole(['Admin']), (req, res) => {
    const { id } = req.params;

    const success = db.deleteTask(id);
    if (!success) {
      res.status(404).json({ error: `Task with ID ${id} not found.` });
      return;
    }

    res.json({ message: `Task '${id}' successfully deleted by Admin.` });
  });


  // ==========================================
  // VITE STATIC FILE SERVING / SPA FALLBACK
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise Task Management System running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start full-stack server:', err);
});
