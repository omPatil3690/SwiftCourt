"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loyaltyRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_js_1 = require("../../middleware/auth.js");
const loyalty_js_1 = require("../../services/loyalty.js");
const auth_js_2 = require("../../middleware/auth.js");
const enums_js_1 = require("../../types/enums.js");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
exports.loyaltyRouter = (0, express_1.Router)();
exports.loyaltyRouter.get('/me', auth_js_1.requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json({ loyaltyPoints: (user === null || user === void 0 ? void 0 : user.loyaltyPoints) || 0, currentStreak: (user === null || user === void 0 ? void 0 : user.currentStreak) || 0 });
});
exports.loyaltyRouter.get('/ledger', auth_js_1.requireAuth, async (req, res) => {
    const entries = await prisma.pointsLedger.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json(entries);
});
exports.loyaltyRouter.post('/adjust', auth_js_1.requireAuth, async (req, res) => {
    if (req.user.role !== 'ADMIN')
        return res.status(403).json({ message: 'Admin only' });
    const schema = zod_1.z.object({ userId: zod_1.z.string(), delta: zod_1.z.number().int(), reason: zod_1.z.string().optional() });
    try {
        const { userId, delta, reason } = schema.parse(req.body);
        await (0, loyalty_js_1.addPoints)(userId, delta, 'ADJUST', { reason });
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
exports.loyaltyRouter.get('/referral/code', auth_js_1.requireAuth, async (req, res) => {
    try {
        const code = await (0, loyalty_js_1.ensureReferralCode)(req.user.id);
        res.json({ code });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
exports.loyaltyRouter.post('/referral/apply', auth_js_1.requireAuth, async (req, res) => {
    const schema = zod_1.z.object({ code: zod_1.z.string() });
    try {
        const { code } = schema.parse(req.body);
        await (0, loyalty_js_1.applyReferral)(code, req.user.id);
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// Admin trigger to process pending referral rewards
exports.loyaltyRouter.post('/referral/process', auth_js_1.requireAuth, (0, auth_js_2.requireRoles)(enums_js_1.UserRole.ADMIN), async (_req, res) => {
    try {
        await (0, loyalty_js_1.processReferralRewards)();
        res.json({ success: true });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
