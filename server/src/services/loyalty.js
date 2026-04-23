"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPoints = addPoints;
exports.recordActivityForStreak = recordActivityForStreak;
exports.ensureReferralCode = ensureReferralCode;
exports.applyReferral = applyReferral;
exports.processReferralRewards = processReferralRewards;
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const prisma = new client_1.PrismaClient();
async function addPoints(userId, delta, source, meta) {
    if (!Number.isFinite(delta) || delta === 0)
        return;
    await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        const newBalance = (user.loyaltyPoints || 0) + delta;
        await tx.user.update({ where: { id: userId }, data: { loyaltyPoints: newBalance } });
        await tx.pointsLedger.create({ data: { userId, delta, balanceAfter: newBalance, source, meta } });
    });
}
async function recordActivityForStreak(userId, activityDate = new Date()) {
    await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        const last = user.lastActivityDate;
        let currentStreak = user.currentStreak || 0;
        if (!last) {
            currentStreak = 1;
        }
        else if ((0, date_fns_1.isSameDay)(activityDate, last)) {
            // same day: no change
            return;
        }
        else if ((0, date_fns_1.isSameDay)(last, (0, date_fns_1.subDays)(activityDate, 1))) {
            currentStreak += 1;
        }
        else {
            currentStreak = 1; // reset
        }
        await tx.user.update({ where: { id: userId }, data: { lastActivityDate: activityDate, currentStreak } });
    });
}
async function ensureReferralCode(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error('User not found');
    if (user.referralCode)
        return user.referralCode;
    // generate simple base36 code
    for (let i = 0; i < 5; i++) {
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        const exists = await prisma.user.findFirst({ where: { referralCode: code } });
        if (!exists) {
            await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
            return code;
        }
    }
    throw new Error('Failed to allocate referral code');
}
async function applyReferral(referrerCode, newUserId) {
    const referrer = await prisma.user.findFirst({ where: { referralCode: referrerCode } });
    if (!referrer)
        throw new Error('Invalid referral code');
    if (referrer.id === newUserId)
        throw new Error('Self referral not allowed');
    await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: newUserId } });
        if (!user)
            throw new Error('User not found');
        if (user.referredById)
            return; // already set
        await tx.user.update({ where: { id: newUserId }, data: { referredById: referrer.id } });
        await tx.referralReward.create({ data: { referrerId: referrer.id, refereeId: newUserId } });
    });
}
async function processReferralRewards({ bookingPoints = 50, refereeBonus = 20 } = {}) {
    // When a referee achieves first confirmed booking, award points.
    const pending = await prisma.referralReward.findMany({ where: { status: 'PENDING' }, include: { referee: true } });
    for (const reward of pending) {
        const bookings = await prisma.booking.count({ where: { userId: reward.refereeId, status: 'CONFIRMED' } });
        if (bookings > 0) {
            await prisma.$transaction(async (tx) => {
                await tx.referralReward.update({ where: { id: reward.id }, data: { status: 'EARNED', earnedAt: new Date() } });
                await tx.user.update({ where: { id: reward.referrerId }, data: { loyaltyPoints: { increment: bookingPoints } } });
                await tx.pointsLedger.create({ data: { userId: reward.referrerId, delta: bookingPoints, balanceAfter: (await tx.user.findUnique({ where: { id: reward.referrerId } })).loyaltyPoints, source: 'REFERRAL', meta: { refereeId: reward.refereeId } } });
                await tx.user.update({ where: { id: reward.refereeId }, data: { loyaltyPoints: { increment: refereeBonus } } });
                await tx.pointsLedger.create({ data: { userId: reward.refereeId, delta: refereeBonus, balanceAfter: (await tx.user.findUnique({ where: { id: reward.refereeId } })).loyaltyPoints, source: 'REFERRAL', meta: { referrerId: reward.referrerId } } });
            });
        }
    }
}
