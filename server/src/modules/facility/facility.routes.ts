import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FacilityStatus, UserRole } from '../../types/enums.js';
import { verifyAccessToken } from '../../utils/jwt.js';
import { z } from 'zod';
import { AuthRequest, requireAuth, requireRoles } from '../../middleware/auth.js';

const prisma = new PrismaClient();
export const facilityRouter = Router();

const createSchema = z.object({
  name: z.string().min(2),
  location: z.string().min(2),
  description: z.string().min(10),
  sports: z.array(z.string()).min(1),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  propertyTypes: z.array(z.enum(["PLAY","BOOK","TRAIN"]))
    .default(["BOOK"]) // default to BOOK to match current behavior
});

facilityRouter.post('/', requireAuth, requireRoles(UserRole.OWNER), async (req: AuthRequest, res: Response) => {
  try {
  const data = createSchema.parse(req.body);
  const facility = await prisma.facility.create({ data: { ...data, ownerId: req.user!.id } });
    res.status(201).json(facility);
  } catch (e: any) { res.status(400).json({ message: e.message }); }
});

facilityRouter.get('/', async (req: Request, res: Response) => {
  const { sport, q, status, page = '1', pageSize = '10' } = req.query as Record<string, string>;
  const where: any = { status: FacilityStatus.APPROVED };
  if (status && Object.values(FacilityStatus).includes(status as FacilityStatus)) where.status = status;
  if (sport) where.sports = { has: sport };
  if (q) where.OR = [ { name: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } } ];
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  const [items, total] = await Promise.all([
    prisma.facility.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { courts: true } }),
    prisma.facility.count({ where })
  ]);
  res.json({ items, total, page: parseInt(page), pageSize: take });
});

facilityRouter.get('/:id', async (req: Request, res: Response) => {
  const facility = await prisma.facility.findUnique({ where: { id: req.params.id }, include: { courts: true } });
  if (!facility) return res.status(404).json({ message: 'Not found' });
  if (facility.status !== FacilityStatus.APPROVED) {
    // Allow owner or admin to view unapproved facility if authenticated
    try {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ')) return res.status(404).json({ message: 'Not found' });
      const payload = verifyAccessToken(auth.slice(7));
      if (payload.role !== 'ADMIN' && payload.sub !== facility.ownerId) return res.status(404).json({ message: 'Not found' });
    } catch {
      return res.status(404).json({ message: 'Not found' });
    }
  }
  res.json(facility);
});

// Admin routes BEFORE dynamic :id to avoid route shadowing
facilityRouter.get('/admin/pending/list', requireAuth, requireRoles(UserRole.ADMIN), async (_req: Request, res: Response) => {
  const pending = await prisma.facility.findMany({ where: { status: FacilityStatus.PENDING }, orderBy: { createdAt: 'asc' } });
  res.json(pending);
});

facilityRouter.post('/admin/:id/approve', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  const updated = await prisma.facility.update({ where: { id: req.params.id }, data: { status: FacilityStatus.APPROVED } });
  res.json(updated);
});

facilityRouter.post('/admin/:id/reject', requireAuth, requireRoles(UserRole.ADMIN), async (req: Request, res: Response) => {
  const updated = await prisma.facility.update({ where: { id: req.params.id }, data: { status: FacilityStatus.REJECTED } });
  res.json(updated);
});

// Facility availability (hourly slots per court)
facilityRouter.get('/:id/availability', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dateParam = (req.query.date as string) || new Date().toISOString().split('T')[0];

    // Get facility with courts
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: { courts: { select: { id: true, name: true, openTime: true, closeTime: true, pricePerHour: true } } }
    });
    if (!facility) return res.status(404).json({ message: 'Not found' });
    if (facility.status !== FacilityStatus.APPROVED) {
      // Validate auth to allow owner/admin preview availability
      try {
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) return res.status(404).json({ message: 'Not found' });
        const payload = verifyAccessToken(auth.slice(7));
        if (payload.role !== 'ADMIN' && payload.sub !== facility.ownerId) return res.status(404).json({ message: 'Not found' });
      } catch {
        return res.status(404).json({ message: 'Not found' });
      }
    }

    // Compute day start/end
    const dayStart = new Date(dateParam);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const courtIds = facility.courts.map(c => c.id);
    // Fetch bookings for the day for these courts
    const bookings = await prisma.booking.findMany({
      where: {
        courtId: { in: courtIds },
        status: { in: ['PENDING', 'CONFIRMED'] as any },
        OR: [
          { startTime: { lt: dayEnd }, endTime: { gt: dayStart } }
        ]
      },
      select: { id: true, courtId: true, startTime: true, endTime: true }
    });

    const now = new Date();
    const slots: Array<{ id: string; startTime: string; endTime: string; price: number; isAvailable: boolean; courtId: string; courtName: string; }>
      = [];

    // Helper to format minutes to HH:mm
    const toHM = (mins: number) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    for (const court of facility.courts) {
      // Generate 1-hour slots between open and close
      for (let startMin = court.openTime; startMin + 60 <= court.closeTime; startMin += 60) {
        const endMin = startMin + 60;
        const slotStart = new Date(dayStart);
        slotStart.setMinutes(startMin);
        const slotEnd = new Date(dayStart);
        slotEnd.setMinutes(endMin);

        // Check overlap with bookings
        const hasOverlap = bookings.some(b => b.courtId === court.id && (slotStart < b.endTime && slotEnd > b.startTime));
        // Optionally, disallow past slots on the same day
        const isPast = slotEnd <= now && dayStart.toDateString() === now.toDateString();

        slots.push({
          id: `${court.id}-${dateParam}-${startMin}`,
          startTime: toHM(startMin),
          endTime: toHM(endMin),
          price: Number(court.pricePerHour),
          isAvailable: !hasOverlap && !isPast,
          courtId: court.id,
          courtName: court.name,
        });
      }
    }

    // Sort by time then court name for stable ordering
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.courtName.localeCompare(b.courtName));

    res.json(slots);
  } catch (e) {
    console.error('Failed to get availability:', e);
    res.status(500).json({ message: 'Failed to get availability' });
  }
});
