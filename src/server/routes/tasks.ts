import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware';
import { Task, TaskMutationRequest, TaskPriority, TaskStatus } from '../../types';

const router = Router();

router.get('/', authenticateToken, (req, res) => {
  const { projectId, assigneeId } = req.query;
  let tasks = db.getTasks();

  if (typeof projectId === 'string' && projectId.length > 0) {
    tasks = tasks.filter((task) => task.projectId === projectId);
  }

  if (typeof assigneeId === 'string' && assigneeId.length > 0) {
    tasks = tasks.filter((task) => task.assigneeId === assigneeId);
  }

  res.json(tasks);
});

router.post('/', authenticateToken, requireRole(['Admin', 'Project Manager']), (req, res) => {
  const { title, description, status, priority, dueDate, assigneeId, projectId } = req.body as TaskMutationRequest;

  if (!title || !projectId) {
    res.status(400).json({ error: 'Title and Project ID are required.' });
    return;
  }

  const projects = db.getProjects();
  if (!projects.some((project) => project.id === projectId)) {
    res.status(400).json({ error: 'The specified Project ID does not exist.' });
    return;
  }

  if (assigneeId) {
    const users = db.getUsers();
    if (!users.some((user) => user.id === assigneeId)) {
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
    updatedAt: new Date().toISOString(),
  };

  const savedTask = db.addTask(newTask);
  res.status(201).json(savedTask);
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const currentUser = authReq.user;
  const body = req.body as TaskMutationRequest;

  if (!currentUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const tasks = db.getTasks();
  const existingTask = tasks.find((task) => task.id === id);

  if (!existingTask) {
    res.status(404).json({ error: `Task with ID ${id} not found.` });
    return;
  }

  if (currentUser.role === 'Admin') {
    const updated = db.updateTask(id, body);
    res.json(updated);
    return;
  }

  if (currentUser.role === 'Project Manager') {
    const updated = db.updateTask(id, body);
    res.json(updated);
    return;
  }

  if (currentUser.role === 'Team Member') {
    if (existingTask.assigneeId !== currentUser.id) {
      res.status(403).json({
        error: `Permission Denied: Team Members can only update tasks assigned to themselves. This task is assigned to '${existingTask.assigneeId || 'Unassigned'}'.`,
      });
      return;
    }

    const requestedKeys = Object.keys(body);
    const invalidKeys = requestedKeys.filter((key) => key !== 'status');

    if (invalidKeys.length > 0) {
      res.status(403).json({
        error: `Permission Denied: As a Team Member, you are only authorized to update the task 'status'. You are not allowed to mutate fields: [${invalidKeys.join(', ')}]`,
      });
      return;
    }

    if (body.status && !['Todo', 'In Progress', 'Review', 'Done'].includes(body.status)) {
      res.status(400).json({ error: 'Invalid task status. Must be one of: Todo, In Progress, Review, Done.' });
      return;
    }

    const updated = db.updateTask(id, { status: body.status as TaskStatus });
    res.json(updated);
    return;
  }

  res.status(403).json({ error: 'Unknown system role. Unauthorized.' });
});

router.delete('/:id', authenticateToken, requireRole(['Admin']), (req, res) => {
  const { id } = req.params;

  const success = db.deleteTask(id);
  if (!success) {
    res.status(404).json({ error: `Task with ID ${id} not found.` });
    return;
  }

  res.json({ message: `Task '${id}' successfully deleted by Admin.` });
});

export default router;
