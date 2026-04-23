import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { BookingStatus, UserRole, PaymentStatus } from '../../types/enums.js';
import { z } from 'zod';
import { AuthRequest, requireAuth, requireRoles } from '../../middleware/auth.js';
import { io } from '../../index.js';
import { addPoints, recordActivityForStreak } from '../../services/loyalty.js';

const prisma = new PrismaClient();
export const bookingRouter = Router();

const bookingSchema = z.object({ courtId: z.string(), startTime: z.string().datetime(), endTime: z.string().datetime() });

bookingRouter.post('/', requireAuth, requireRoles(UserRole.USER, UserRole.OWNER, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { courtId, startTime, endTime } = bookingSchema.parse(req.body);
    const start = new Date(startTime); const end = new Date(endTime);
    if (end <= start) return res.status(400).json({ message: 'Invalid time range' });
    const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const overlap = await tx.booking.findFirst({
        where: {
          courtId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          OR: [
            { startTime: { lt: end }, endTime: { gt: start } }
          ]
        }
      });
      if (overlap) throw new Error('Slot unavailable');
      const court = await tx.court.findUnique({ where: { id: courtId }, include: { facility: { select: { ownerId: true, id: true, name: true } } } });
      if (!court) throw new Error('Court not found');
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const price = hours * Number(court.pricePerHour);
      const created = await tx.booking.create({ data: { courtId, userId: req.user!.id, startTime: start, endTime: end, price: price.toFixed(2) as any, status: BookingStatus.CONFIRMED } });
      // Record a successful payment for revenue tracking (demo)
      await tx.payment.create({ data: { bookingId: created.id, amount: price.toFixed(2) as any, provider: 'internal', providerRef: `bk_${created.id}`, status: PaymentStatus.SUCCEEDED } });
      return { created, ownerId: court.facility.ownerId, facilityId: court.facility.id, facilityName: court.facility.name };
    });

    // Notify owner and user via socket rooms
    const payload = { bookingId: booking.created.id, courtId, startTime, endTime, facilityId: booking.facilityId };
    io.to(`owner:${booking.ownerId}`).emit('booking:new', { ...payload, facilityName: booking.facilityName });
    io.to(`user:${req.user!.id}`).emit('booking:confirmed', payload);

    // Award loyalty points (simple rule: 10 points per hour)
    try {
      const start = new Date(startTime); const end = new Date(endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const points = Math.max(1, Math.round(hours * 10));
      await addPoints(req.user!.id, points, 'BOOKING', { bookingId: booking.created.id, hours });
      await recordActivityForStreak(req.user!.id);
    } catch (e) { console.warn('Loyalty award failed', e); }
    res.status(201).json(booking.created);
  } catch (e: any) { res.status(400).json({ message: e.message }); }
});

// Cancel a booking
bookingRouter.put('/:id/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.booking.findUnique({ where: { id }, include: { court: { include: { facility: true } } } });
    if (!existing) return res.status(404).json({ message: 'Booking not found' });

    const isOwner = existing.court.facility.ownerId === req.user!.id;
    const isBooker = existing.userId === req.user!.id;
    const isAdmin = req.user!.role === UserRole.ADMIN;
    if (!isBooker && !isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized to cancel this booking' });

    if (existing.status !== BookingStatus.CONFIRMED) return res.status(400).json({ message: 'Only confirmed bookings can be cancelled' });

    const now = new Date();
    const diffMinutes = (new Date(existing.startTime).getTime() - now.getTime()) / (1000 * 60);
    if (diffMinutes <= 30 && !isAdmin && !isOwner) {
      return res.status(400).json({ message: 'Cannot cancel within 30 minutes of start time' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.booking.update({ where: { id }, data: { status: BookingStatus.CANCELLED } });
      // Mark payments as refunded (best-effort)
      await tx.payment.updateMany({ where: { bookingId: id }, data: { status: PaymentStatus.REFUNDED } });
      return u;
    });

    const socketPayload = { bookingId: updated.id, courtId: existing.courtId, startTime: existing.startTime, endTime: existing.endTime, facilityId: existing.court.facility.id };
    // Notify owner and user via socket rooms
    io.to(`owner:${existing.court.facility.ownerId}`).emit('booking:cancelled', socketPayload);
    io.to(`user:${existing.userId}`).emit('booking:cancelled', socketPayload);

    res.json(updated);
  } catch (e: any) {
    console.error('Cancel booking failed:', e);
    res.status(400).json({ message: e.message || 'Failed to cancel booking' });
  }
});

// Delete a booking (only by booker); only if CANCELLED or COMPLETED
bookingRouter.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Booking not found' });
    if (existing.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (![BookingStatus.CANCELLED, BookingStatus.COMPLETED].includes(existing.status as any)) {
      return res.status(400).json({ message: 'Only cancelled or completed bookings can be deleted' });
    }
    await prisma.booking.delete({ where: { id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ message: e.message || 'Failed to delete booking' });
  }
});

bookingRouter.get('/my', requireAuth, async (req: AuthRequest, res: Response) => {
  const bookings = await prisma.booking.findMany({ where: { userId: req.user!.id }, orderBy: { startTime: 'desc' }, include: { court: { include: { facility: true } } } });
  res.json(bookings);
});

bookingRouter.get('/owner/stats', requireAuth, requireRoles(UserRole.OWNER, UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;

    const [totalBookings, succ, refd] = await Promise.all([
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED, court: { facility: { ownerId } } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.SUCCEEDED, booking: { court: { facility: { ownerId } } } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: PaymentStatus.REFUNDED, booking: { court: { facility: { ownerId } } } } })
    ]);

    const succeeded = Number(succ._sum.amount || 0);
    const refunded = Number(refd._sum.amount || 0);
    const net = Math.max(0, succeeded - refunded);

    res.json({
      totalBookings,
      payments: {
        succeeded,
        refunded,
        net
      }
    });
  } catch (e: any) {
    res.status(400).json({ message: e.message || 'Failed to load stats' });
  }
});
