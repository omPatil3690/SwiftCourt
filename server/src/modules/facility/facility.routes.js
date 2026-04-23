"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facilityRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const enums_js_1 = require("../../types/enums.js");
const jwt_js_1 = require("../../utils/jwt.js");
const zod_1 = require("zod");
const auth_js_1 = require("../../middleware/auth.js");
const prisma = new client_1.PrismaClient();
exports.facilityRouter = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    location: zod_1.z.string().min(2),
    description: zod_1.z.string().min(10),
    sports: zod_1.z.array(zod_1.z.string()).min(1),
    amenities: zod_1.z.array(zod_1.z.string()).default([]),
    images: zod_1.z.array(zod_1.z.string().url()).default([]),
    propertyTypes: zod_1.z.array(zod_1.z.enum(["PLAY", "BOOK", "TRAIN"]))
        .default(["BOOK"]) // default to BOOK to match current behavior
});
exports.facilityRouter.post('/', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.OWNER), async (req, res) => {
    try {
        const data = createSchema.parse(req.body);
        const facility = await prisma.facility.create({ data: { ...data, ownerId: req.user.id } });
        res.status(201).json(facility);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
exports.facilityRouter.get('/', async (req, res) => {
    const { sport, q, status, page = '1', pageSize = '10' } = req.query;
    const where = { status: enums_js_1.FacilityStatus.APPROVED };
    if (status && Object.values(enums_js_1.FacilityStatus).includes(status))
        where.status = status;
    if (sport)
        where.sports = { has: sport };
    if (q)
        where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } }];
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);
    const [items, total] = await Promise.all([
        prisma.facility.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { courts: true } }),
        prisma.facility.count({ where })
    ]);
    res.json({ items, total, page: parseInt(page), pageSize: take });
});
exports.facilityRouter.get('/:id', async (req, res) => {
    const facility = await prisma.facility.findUnique({ where: { id: req.params.id }, include: { courts: true } });
    if (!facility)
        return res.status(404).json({ message: 'Not found' });
    if (facility.status !== enums_js_1.FacilityStatus.APPROVED) {
        // Allow owner or admin to view unapproved facility if authenticated
        try {
            const auth = req.headers.authorization;
            if (!(auth === null || auth === void 0 ? void 0 : auth.startsWith('Bearer ')))
                return res.status(404).json({ message: 'Not found' });
            const payload = (0, jwt_js_1.verifyAccessToken)(auth.slice(7));
            if (payload.role !== 'ADMIN' && payload.sub !== facility.ownerId)
                return res.status(404).json({ message: 'Not found' });
        }
        catch {
            return res.status(404).json({ message: 'Not found' });
        }
    }
    res.json(facility);
});
// Admin routes BEFORE dynamic :id to avoid route shadowing
exports.facilityRouter.get('/admin/pending/list', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.ADMIN), async (_req, res) => {
    const pending = await prisma.facility.findMany({ where: { status: enums_js_1.FacilityStatus.PENDING }, orderBy: { createdAt: 'asc' } });
    res.json(pending);
});
exports.facilityRouter.post('/admin/:id/approve', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.ADMIN), async (req, res) => {
    const updated = await prisma.facility.update({ where: { id: req.params.id }, data: { status: enums_js_1.FacilityStatus.APPROVED } });
    res.json(updated);
});
exports.facilityRouter.post('/admin/:id/reject', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.ADMIN), async (req, res) => {
    const updated = await prisma.facility.update({ where: { id: req.params.id }, data: { status: enums_js_1.FacilityStatus.REJECTED } });
    res.json(updated);
});
// Facility availability (hourly slots per court)
exports.facilityRouter.get('/:id/availability', async (req, res) => {
    try {
        const { id } = req.params;
        const dateParam = req.query.date || new Date().toISOString().split('T')[0];
        // Get facility with courts
        const facility = await prisma.facility.findUnique({
            where: { id },
            include: { courts: { select: { id: true, name: true, openTime: true, closeTime: true, pricePerHour: true } } }
        });
        if (!facility)
            return res.status(404).json({ message: 'Not found' });
        if (facility.status !== enums_js_1.FacilityStatus.APPROVED) {
            // Validate auth to allow owner/admin preview availability
            try {
                const auth = req.headers.authorization;
                if (!(auth === null || auth === void 0 ? void 0 : auth.startsWith('Bearer ')))
                    return res.status(404).json({ message: 'Not found' });
                const payload = (0, jwt_js_1.verifyAccessToken)(auth.slice(7));
                if (payload.role !== 'ADMIN' && payload.sub !== facility.ownerId)
                    return res.status(404).json({ message: 'Not found' });
            }
            catch {
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
                status: { in: ['PENDING', 'CONFIRMED'] },
                OR: [
                    { startTime: { lt: dayEnd }, endTime: { gt: dayStart } }
                ]
            },
            select: { id: true, courtId: true, startTime: true, endTime: true }
        });
        const now = new Date();
        const slots = [];
        // Helper to format minutes to HH:mm
        const toHM = (mins) => {
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
    }
    catch (e) {
        console.error('Failed to get availability:', e);
        res.status(500).json({ message: 'Failed to get availability' });
    }
});
