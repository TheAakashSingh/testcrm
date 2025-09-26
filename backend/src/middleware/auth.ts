import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  const verified = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
  req.user = verified;
  try {
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};