import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '../../types/enums.js';
import { evaluateUserBadges, evaluateAllBadges } from '../../services/badges.js';

const prisma = new PrismaClient();
export const badgeRouter = Router();

badgeRouter.get('/', async (_req, res) => {
  const badges = await prisma.badge.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } });
  res.json(badges);
});

badgeRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  await evaluateUserBadges(req.user!.id);
  const earned = await prisma.userBadge.findMany({ where: { userId: req.user!.id }, include: { badge: true } });
  res.json(earned.map(ub => ({ id: ub.badge.id, code: ub.badge.code, name: ub.badge.name, description: ub.badge.description, earnedAt: ub.earnedAt })));
});

badgeRouter.post('/evaluate-all', requireAuth, requireRoles(UserRole.ADMIN), async (_req: AuthRequest, res) => {
  await evaluateAllBadges();
  res.json({ success: true });
});
