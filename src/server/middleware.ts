import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { AuthTokenPayload, UserRole, User } from '../types';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://task-management-theta-six.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const isAllowedOrigin = typeof origin === 'string' && ALLOWED_ORIGINS.includes(origin);

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.sendStatus(204);
    return;
  }

  next();
}

export const JWT_SECRET = process.env.JWT_SECRET || 'enterprise-super-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware to authenticate JWT tokens in the Authorization header.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required. Please sign in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === 'string' || !decoded || !(decoded as AuthTokenPayload).userId) {
      res.status(403).json({ error: 'Malformed token payload.' });
      return;
    }

    const payload = decoded as AuthTokenPayload;

    // Lookup user in DB to verify they still exist and retrieve latest role
    const users = db.getUsers();
    const user = users.find((candidate) => candidate.id === payload.userId);

    if (!user) {
      res.status(404).json({ error: 'Authenticated user no longer exists.' });
      return;
    }

    // Attach basic user object (excluding passwordHash)
    const { passwordHash, ...safeUser } = user;
    (req as AuthenticatedRequest).user = safeUser;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired access token.' });
  }
}

/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 * Checks if the authenticated user possesses one of the allowed roles.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: `Access Denied. Your role is '${user.role}', but this action requires one of: [${allowedRoles.join(', ')}]`
      });
      return;
    }

    next();
  };
}
