import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, requireRole('Admin'), async (req: AuthRequest, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  res.json(users);
});

router.post('/', authenticateToken, requireRole('Admin'), async (req: AuthRequest, res) => {
  const { email, password, name, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

export default router;