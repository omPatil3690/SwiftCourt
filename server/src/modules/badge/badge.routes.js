"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.badgeRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_js_1 = require("../../middleware/auth.js");
const enums_js_1 = require("../../types/enums.js");
const badges_js_1 = require("../../services/badges.js");
const prisma = new client_1.PrismaClient();
exports.badgeRouter = (0, express_1.Router)();
exports.badgeRouter.get('/', async (_req, res) => {
    const badges = await prisma.badge.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } });
    res.json(badges);
});
exports.badgeRouter.get('/me', auth_js_1.requireAuth, async (req, res) => {
    await (0, badges_js_1.evaluateUserBadges)(req.user.id);
    const earned = await prisma.userBadge.findMany({ where: { userId: req.user.id }, include: { badge: true } });
    res.json(earned.map(ub => ({ id: ub.badge.id, code: ub.badge.code, name: ub.badge.name, description: ub.badge.description, earnedAt: ub.earnedAt })));
});
exports.badgeRouter.post('/evaluate-all', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.ADMIN), async (_req, res) => {
    await (0, badges_js_1.evaluateAllBadges)();
    res.json({ success: true });
});
