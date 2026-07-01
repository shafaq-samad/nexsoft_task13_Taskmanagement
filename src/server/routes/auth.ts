import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { authenticateToken, JWT_SECRET, AuthenticatedRequest } from '../middleware';
import { AuthResponse, RegisterRequest, UserRole } from '../../types';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password, name, role, avatarUrl } = req.body as RegisterRequest;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password, and name are required.' });
    return;
  }

  const users = db.getUsers();
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: 'A user with this email already exists.' });
    return;
  }

  let assignedRole: UserRole = 'Team Member';
  if (role && ['Admin', 'Project Manager', 'Team Member'].includes(role)) {
    assignedRole = role;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const id = `user-${Date.now()}`;

  const newUser = {
    id,
    email: email.toLowerCase(),
    name,
    role: assignedRole,
    avatarUrl: avatarUrl || `/avatars/${assignedRole === 'Admin' ? 'admin' : assignedRole === 'Project Manager' ? 'manager' : 'member-1'}.svg`,
  };

  db.addUser({ ...newUser, passwordHash });

  const token = jwt.sign({ userId: id, role: assignedRole }, JWT_SECRET, { expiresIn: '7d' });

  const response: AuthResponse = {
    token,
    user: newUser,
  };

  res.status(201).json(response);
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const users = db.getUsers();
  const user = users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash, ...safeUser } = user;

  const response: AuthResponse = {
    token,
    user: safeUser,
  };

  res.json(response);
});

router.get('/me', authenticateToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  res.json(authReq.user);
});

export default router;
