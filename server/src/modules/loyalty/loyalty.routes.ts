import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';
import { addPoints, ensureReferralCode, applyReferral, processReferralRewards } from '../../services/loyalty.js';
import { requireRoles } from '../../middleware/auth.js';
import { UserRole } from '../../types/enums.js';
import { z } from 'zod';

const prisma = new PrismaClient();
export const loyaltyRouter = Router();

loyaltyRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  res.json({ loyaltyPoints: user?.loyaltyPoints || 0, currentStreak: user?.currentStreak || 0 });
});

loyaltyRouter.get('/ledger', requireAuth, async (req: AuthRequest, res) => {
  const entries = await prisma.pointsLedger.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json(entries);
});

loyaltyRouter.post('/adjust', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== 'ADMIN') return res.status(403).json({ message: 'Admin only' });
  const schema = z.object({ userId: z.string(), delta: z.number().int(), reason: z.string().optional() });
  try {
    const { userId, delta, reason } = schema.parse(req.body);
    await addPoints(userId, delta, 'ADJUST', { reason });
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ message: e.message }); }
});

loyaltyRouter.get('/referral/code', requireAuth, async (req: AuthRequest, res) => {
  try { const code = await ensureReferralCode(req.user!.id); res.json({ code }); }
  catch (e: any) { res.status(400).json({ message: e.message }); }
});

loyaltyRouter.post('/referral/apply', requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({ code: z.string() });
  try { const { code } = schema.parse(req.body); await applyReferral(code, req.user!.id); res.json({ success: true }); }
  catch (e: any) { res.status(400).json({ message: e.message }); }
});

// Admin trigger to process pending referral rewards
loyaltyRouter.post('/referral/process', requireAuth, requireRoles(UserRole.ADMIN), async (_req: AuthRequest, res) => {
  try { await processReferralRewards(); res.json({ success: true }); }
  catch (e: any) { res.status(400).json({ message: e.message }); }
});
