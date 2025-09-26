import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const { type, description, leadId } = req.body;
  const activity = await prisma.activity.create({
    data: { type, description, leadId, userId: req.user!.id },
    include: { user: true },
  });
  res.json(activity);
});

router.get('/lead/:leadId', authenticateToken, async (req: AuthRequest, res) => {
  const { leadId } = req.params;
  const activities = await prisma.activity.findMany({
    where: { leadId: parseInt(leadId) },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(activities);
});

export default router;