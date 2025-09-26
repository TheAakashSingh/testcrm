import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getIo } from '../socket';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  const leads = await prisma.lead.findMany({
    include: { assignedTo: true, activities: { include: { user: true }, orderBy: { createdAt: 'desc' } } },
  });
  res.json(leads);
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const { name, email, phone, company, status, assignedToId } = req.body;
  const lead = await prisma.lead.create({
    data: { name, email, phone, company, status, assignedToId },
    include: { assignedTo: true, activities: true },
  });
  getIo().emit('leadUpdate');
  res.json(lead);
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, email, phone, company, status, assignedToId } = req.body;
  const lead = await prisma.lead.update({
    where: { id: parseInt(id) },
    data: { name, email, phone, company, status, assignedToId },
    include: { assignedTo: true, activities: true },
  });
  getIo().emit('leadUpdate');
  res.json(lead);
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { id } = req.params;
  await prisma.lead.delete({ where: { id: parseInt(id) } });
  getIo().emit('leadUpdate');
  res.json({ message: 'Lead deleted' });
});

export default router;