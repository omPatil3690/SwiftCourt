"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingExtrasRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_js_1 = require("../../middleware/auth.js");
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
const enums_js_1 = require("../../types/enums.js");
const prisma = new client_1.PrismaClient();
exports.bookingExtrasRouter = (0, express_1.Router)();
// Create booking invite(s)
exports.bookingExtrasRouter.post('/:id/invites', auth_js_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({ emails: zod_1.z.array(zod_1.z.string().email()).min(1).max(10) });
    try {
        const { id } = req.params;
        const { emails } = schema.parse(req.body);
        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId !== req.user.id)
            return res.status(403).json({ message: 'Not owner of booking' });
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
        const created = await Promise.all(emails.map(email => prisma.bookingInvite.create({ data: { bookingId: id, inviterId: req.user.id, inviteeEmail: email, token: crypto_1.default.randomBytes(16).toString('hex'), expiresAt } })));
        res.status(201).json(created.map(c => ({ id: c.id, email: c.inviteeEmail, status: c.status, token: c.token })));
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// Accept / Decline invite via token
exports.bookingExtrasRouter.post('/invites/:token/respond', auth_js_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({ action: zod_1.z.enum(['ACCEPT', 'DECLINE']) });
    try {
        const { token } = req.params;
        const { action } = schema.parse(req.body);
        const invite = await prisma.bookingInvite.findUnique({ where: { token } });
        if (!invite)
            return res.status(404).json({ message: 'Invite not found' });
        if (invite.expiresAt < new Date()) {
            await prisma.bookingInvite.update({ where: { id: invite.id }, data: { status: enums_js_1.InviteStatus.EXPIRED } });
            return res.status(400).json({ message: 'Invite expired' });
        }
        if (invite.status !== enums_js_1.InviteStatus.PENDING)
            return res.status(400).json({ message: 'Already responded' });
        await prisma.bookingInvite.update({ where: { id: invite.id }, data: { status: action === 'ACCEPT' ? enums_js_1.InviteStatus.ACCEPTED : enums_js_1.InviteStatus.DECLINED, respondedAt: new Date() } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// List invites for a booking (owner)
exports.bookingExtrasRouter.get('/:id/invites', auth_js_1.requireAuth, async (req, res) => {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking)
        return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId !== req.user.id)
        return res.status(403).json({ message: 'Not owner of booking' });
    const invites = await prisma.bookingInvite.findMany({ where: { bookingId: id }, orderBy: { createdAt: 'desc' } });
    res.json(invites);
});
// Create shareable link (one per booking, idempotent)
exports.bookingExtrasRouter.post('/:id/share-link', auth_js_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await prisma.booking.findUnique({ where: { id } });
        if (!booking)
            return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId !== req.user.id)
            return res.status(403).json({ message: 'Not owner of booking' });
        let link = await prisma.shareableBookingLink.findUnique({ where: { bookingId: id } });
        if (!link) {
            const slug = crypto_1.default.randomBytes(6).toString('hex');
            link = await prisma.shareableBookingLink.create({ data: { bookingId: id, slug } });
        }
        res.json({ slug: link.slug });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// Public view booking by slug (view only limited fields)
exports.bookingExtrasRouter.get('/public/slug/:slug', async (req, res) => {
    const { slug } = req.params;
    const link = await prisma.shareableBookingLink.findUnique({ where: { slug }, include: { booking: { include: { court: { include: { facility: true } } } } } });
    if (!link)
        return res.status(404).json({ message: 'Not found' });
    const b = link.booking;
    res.json({ id: b.id, startTime: b.startTime, endTime: b.endTime, facility: { id: b.court.facility.id, name: b.court.facility.name }, courtId: b.courtId });
});
