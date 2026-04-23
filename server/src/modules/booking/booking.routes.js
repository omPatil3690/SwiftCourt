"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const enums_js_1 = require("../../types/enums.js");
const zod_1 = require("zod");
const auth_js_1 = require("../../middleware/auth.js");
const index_js_1 = require("../../index.js");
const loyalty_js_1 = require("../../services/loyalty.js");
const prisma = new client_1.PrismaClient();
exports.bookingRouter = (0, express_1.Router)();
const bookingSchema = zod_1.z.object({ courtId: zod_1.z.string(), startTime: zod_1.z.string().datetime(), endTime: zod_1.z.string().datetime() });
exports.bookingRouter.post('/', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.USER, enums_js_1.UserRole.OWNER, enums_js_1.UserRole.ADMIN), async (req, res) => {
    try {
        const { courtId, startTime, endTime } = bookingSchema.parse(req.body);
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (end <= start)
            return res.status(400).json({ message: 'Invalid time range' });
        const booking = await prisma.$transaction(async (tx) => {
            const overlap = await tx.booking.findFirst({
                where: {
                    courtId,
                    status: { in: [enums_js_1.BookingStatus.PENDING, enums_js_1.BookingStatus.CONFIRMED] },
                    OR: [
                        { startTime: { lt: end }, endTime: { gt: start } }
                    ]
                }
            });
            if (overlap)
                throw new Error('Slot unavailable');
            const court = await tx.court.findUnique({ where: { id: courtId }, include: { facility: { select: { ownerId: true, id: true, name: true } } } });
            if (!court)
                throw new Error('Court not found');
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const price = hours * Number(court.pricePerHour);
            const created = await tx.booking.create({ data: { courtId, userId: req.user.id, startTime: start, endTime: end, price: price.toFixed(2), status: enums_js_1.BookingStatus.CONFIRMED } });
            // Record a successful payment for revenue tracking (demo)
            await tx.payment.create({ data: { bookingId: created.id, amount: price.toFixed(2), provider: 'internal', providerRef: `bk_${created.id}`, status: enums_js_1.PaymentStatus.SUCCEEDED } });
            return { created, ownerId: court.facility.ownerId, facilityId: court.facility.id, facilityName: court.facility.name };
        });
        // Notify owner and user via socket rooms
        const payload = { bookingId: booking.created.id, courtId, startTime, endTime, facilityId: booking.facilityId };
        index_js_1.io.to(`owner:${booking.ownerId}`).emit('booking:new', { ...payload, facilityName: booking.facilityName });
        index_js_1.io.to(`user:${req.user.id}`).emit('booking:confirmed', payload);
        // Award loyalty points (simple rule: 10 points per hour)
        try {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const points = Math.max(1, Math.round(hours * 10));
            await (0, loyalty_js_1.addPoints)(req.user.id, points, 'BOOKING', { bookingId: booking.created.id, hours });
            await (0, loyalty_js_1.recordActivityForStreak)(req.user.id);
        }
        catch (e) {
            console.warn('Loyalty award failed', e);
        }
        res.status(201).json(booking.created);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// Cancel a booking
exports.bookingRouter.put('/:id/cancel', auth_js_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.booking.findUnique({ where: { id }, include: { court: { include: { facility: true } } } });
        if (!existing)
            return res.status(404).json({ message: 'Booking not found' });
        const isOwner = existing.court.facility.ownerId === req.user.id;
        const isBooker = existing.userId === req.user.id;
        const isAdmin = req.user.role === enums_js_1.UserRole.ADMIN;
        if (!isBooker && !isOwner && !isAdmin)
            return res.status(403).json({ message: 'Not authorized to cancel this booking' });
        if (existing.status !== enums_js_1.BookingStatus.CONFIRMED)
            return res.status(400).json({ message: 'Only confirmed bookings can be cancelled' });
        const now = new Date();
        const diffMinutes = (new Date(existing.startTime).getTime() - now.getTime()) / (1000 * 60);
        if (diffMinutes <= 30 && !isAdmin && !isOwner) {
            return res.status(400).json({ message: 'Cannot cancel within 30 minutes of start time' });
        }
        const updated = await prisma.$transaction(async (tx) => {
            const u = await tx.booking.update({ where: { id }, data: { status: enums_js_1.BookingStatus.CANCELLED } });
            // Mark payments as refunded (best-effort)
            await tx.payment.updateMany({ where: { bookingId: id }, data: { status: enums_js_1.PaymentStatus.REFUNDED } });
            return u;
        });
        const socketPayload = { bookingId: updated.id, courtId: existing.courtId, startTime: existing.startTime, endTime: existing.endTime, facilityId: existing.court.facility.id };
        // Notify owner and user via socket rooms
        index_js_1.io.to(`owner:${existing.court.facility.ownerId}`).emit('booking:cancelled', socketPayload);
        index_js_1.io.to(`user:${existing.userId}`).emit('booking:cancelled', socketPayload);
        res.json(updated);
    }
    catch (e) {
        console.error('Cancel booking failed:', e);
        res.status(400).json({ message: e.message || 'Failed to cancel booking' });
    }
});
// Delete a booking (only by booker); only if CANCELLED or COMPLETED
exports.bookingRouter.delete('/:id', auth_js_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.booking.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ message: 'Booking not found' });
        if (existing.userId !== req.user.id && req.user.role !== enums_js_1.UserRole.ADMIN) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (![enums_js_1.BookingStatus.CANCELLED, enums_js_1.BookingStatus.COMPLETED].includes(existing.status)) {
            return res.status(400).json({ message: 'Only cancelled or completed bookings can be deleted' });
        }
        await prisma.booking.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ message: e.message || 'Failed to delete booking' });
    }
});
exports.bookingRouter.get('/my', auth_js_1.requireAuth, async (req, res) => {
    const bookings = await prisma.booking.findMany({ where: { userId: req.user.id }, orderBy: { startTime: 'desc' }, include: { court: { include: { facility: true } } } });
    res.json(bookings);
});
exports.bookingRouter.get('/owner/stats', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.OWNER, enums_js_1.UserRole.ADMIN), async (req, res) => {
    try {
        const ownerId = req.user.id;
        const [totalBookings, succ, refd] = await Promise.all([
            prisma.booking.count({ where: { status: enums_js_1.BookingStatus.CONFIRMED, court: { facility: { ownerId } } } }),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { status: enums_js_1.PaymentStatus.SUCCEEDED, booking: { court: { facility: { ownerId } } } } }),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { status: enums_js_1.PaymentStatus.REFUNDED, booking: { court: { facility: { ownerId } } } } })
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
    }
    catch (e) {
        res.status(400).json({ message: e.message || 'Failed to load stats' });
    }
});
