import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware';
import { ProjectCreateRequest } from '../../types';

const router = Router();

router.get('/', authenticateToken, (_req, res) => {
  res.json(db.getProjects());
});

router.post('/', authenticateToken, requireRole(['Admin', 'Project Manager']), (req, res) => {
  const { name, description } = req.body as ProjectCreateRequest;
  const authReq = req as AuthenticatedRequest;

  if (!name) {
    res.status(400).json({ error: 'Project name is required.' });
    return;
  }

  const newProject = {
    id: `proj-${Date.now()}`,
    name,
    description: description || '',
    managerId: authReq.user?.id || null,
  };

  db.addProject(newProject);
  res.status(201).json(newProject);
});

export default router;
