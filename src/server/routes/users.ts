import { Router } from 'express';
import { authenticateToken } from '../middleware';
import { db } from '../db';

const router = Router();

router.get('/', authenticateToken, (_req, res) => {
  const users = db.getUsers().map(({ passwordHash, ...safeUser }) => safeUser);
  res.json(users);
});

export default router;
