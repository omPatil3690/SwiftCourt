import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../../middleware/auth.js';
import { z } from 'zod';
import crypto from 'crypto';
import { InviteStatus } from '../../types/enums.js';

const prisma = new PrismaClient();
export const bookingExtrasRouter = Router();

// Create booking invite(s)
bookingExtrasRouter.post('/:id/invites', requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({ emails: z.array(z.string().email()).min(1).max(10) });
  try {
    const { id } = req.params;
    const { emails } = schema.parse(req.body);
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user!.id) return res.status(403).json({ message: 'Not owner of booking' });
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    const created = await Promise.all(emails.map(email => prisma.bookingInvite.create({ data: { bookingId: id, inviterId: req.user!.id, inviteeEmail: email, token: crypto.randomBytes(16).toString('hex'), expiresAt } })));
    res.status(201).json(created.map(c => ({ id: c.id, email: c.inviteeEmail, status: c.status, token: c.token })));
  } catch (e: any) { res.status(400).json({ message: e.message }); }
});

// Accept / Decline invite via token
bookingExtrasRouter.post('/invites/:token/respond', requireAuth, async (req: AuthRequest, res) => {
  const schema = z.object({ action: z.enum(['ACCEPT','DECLINE']) });
  try {
    const { token } = req.params; const { action } = schema.parse(req.body);
    const invite = await prisma.bookingInvite.findUnique({ where: { token } });
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.expiresAt < new Date()) {
      await prisma.bookingInvite.update({ where: { id: invite.id }, data: { status: InviteStatus.EXPIRED } });
      return res.status(400).json({ message: 'Invite expired' });
    }
    if (invite.status !== InviteStatus.PENDING) return res.status(400).json({ message: 'Already responded' });
    await prisma.bookingInvite.update({ where: { id: invite.id }, data: { status: action === 'ACCEPT' ? InviteStatus.ACCEPTED : InviteStatus.DECLINED, respondedAt: new Date() } });
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ message: e.message }); }
});

// List invites for a booking (owner)
bookingExtrasRouter.get('/:id/invites', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.userId !== req.user!.id) return res.status(403).json({ message: 'Not owner of booking' });
  const invites = await prisma.bookingInvite.findMany({ where: { bookingId: id }, orderBy: { createdAt: 'desc' } });
  res.json(invites);
});

// Create shareable link (one per booking, idempotent)
bookingExtrasRouter.post('/:id/share-link', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user!.id) return res.status(403).json({ message: 'Not owner of booking' });
    let link = await prisma.shareableBookingLink.findUnique({ where: { bookingId: id } });
    if (!link) {
      const slug = crypto.randomBytes(6).toString('hex');
      link = await prisma.shareableBookingLink.create({ data: { bookingId: id, slug } });
    }
    res.json({ slug: link.slug });
  } catch (e: any) { res.status(400).json({ message: e.message }); }
});

// Public view booking by slug (view only limited fields)
bookingExtrasRouter.get('/public/slug/:slug', async (req, res) => {
  const { slug } = req.params;
  const link = await prisma.shareableBookingLink.findUnique({ where: { slug }, include: { booking: { include: { court: { include: { facility: true } } } } } });
  if (!link) return res.status(404).json({ message: 'Not found' });
  const b = link.booking;
  res.json({ id: b.id, startTime: b.startTime, endTime: b.endTime, facility: { id: b.court.facility.id, name: b.court.facility.name }, courtId: b.courtId });
});
