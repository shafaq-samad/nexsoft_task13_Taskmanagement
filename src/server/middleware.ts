import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { UserRole, User } from '../types';

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

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired access token.' });
      return;
    }

    if (!decoded || !decoded.userId) {
      res.status(403).json({ error: 'Malformed token payload.' });
      return;
    }

    // Lookup user in DB to verify they still exist and retrieve latest role
    const users = db.getUsers();
    const user = users.find(u => u.id === decoded.userId);

    if (!user) {
      res.status(404).json({ error: 'Authenticated user no longer exists.' });
      return;
    }

    // Attach basic user object (excluding passwordHash)
    const { passwordHash, ...safeUser } = user;
    (req as AuthenticatedRequest).user = safeUser;
    next();
  });
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
