"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.verifyOtp = verifyOtp;
exports.login = login;
exports.rotateRefreshToken = rotateRefreshToken;
exports.logout = logout;
const client_1 = require("@prisma/client");
const hash_js_1 = require("../../utils/hash.js");
const jwt_js_1 = require("../../utils/jwt.js");
const env_js_1 = require("../../config/env.js");
const prisma = new client_1.PrismaClient();
async function registerUser(params) {
    const existing = await prisma.user.findUnique({ where: { email: params.email } });
    if (existing)
        throw new Error('Email already registered');
    const passwordHash = await (0, hash_js_1.hashPassword)(params.password);
    const user = await prisma.user.create({ data: { email: params.email, passwordHash, fullName: params.fullName, role: params.role, avatarUrl: params.avatarUrl } });
    const otp = (0, hash_js_1.generateOtp)();
    const otpHash = (0, hash_js_1.sha256)(otp);
    const expiresAt = new Date(Date.now() + env_js_1.env.otpTtlMinutes * 60 * 1000);
    await prisma.verificationToken.create({ data: { userId: user.id, otpHash, expiresAt } });
    console.log(`[OTP] for ${user.email}: ${otp}`);
    return { userId: user.id };
}
async function verifyOtp(userId, otp) {
    const token = await prisma.verificationToken.findFirst({ where: { userId, usedAt: null }, orderBy: { createdAt: 'desc' } });
    if (!token)
        throw new Error('No verification token');
    if (token.expiresAt < new Date())
        throw new Error('OTP expired');
    if (token.otpHash !== (0, hash_js_1.sha256)(otp))
        throw new Error('Invalid OTP');
    await prisma.verificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
    return { success: true };
}
async function login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new Error('Invalid credentials');
    const valid = await (0, hash_js_1.verifyPassword)(password, user.passwordHash);
    if (!valid)
        throw new Error('Invalid credentials');
    if (user.status === 'BANNED')
        throw new Error('User banned');
    const accessToken = (0, jwt_js_1.signAccessToken)({ sub: user.id, role: user.role });
    const refreshToken = (0, jwt_js_1.signRefreshToken)({ sub: user.id, role: user.role });
    const tokenHash = (0, hash_js_1.sha256)(refreshToken);
    const expiresAt = new Date(Date.now() + parseTtl(env_js_1.env.refreshTokenTtl));
    await prisma.refreshToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
    return { accessToken, refreshToken };
}
async function rotateRefreshToken(oldToken) {
    let payload;
    try {
        payload = (0, jwt_js_1.verifyRefreshToken)(oldToken);
    }
    catch {
        throw new Error('Invalid token');
    }
    const tokenHash = (0, hash_js_1.sha256)(oldToken);
    const existing = await prisma.refreshToken.findFirst({ where: { tokenHash, revokedAt: null } });
    if (!existing)
        throw new Error('Token revoked');
    if (existing.expiresAt < new Date())
        throw new Error('Token expired');
    await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
    const accessToken = (0, jwt_js_1.signAccessToken)({ sub: payload.sub, role: payload.role });
    const refreshToken = (0, jwt_js_1.signRefreshToken)({ sub: payload.sub, role: payload.role });
    await prisma.refreshToken.create({ data: { userId: payload.sub, tokenHash: (0, hash_js_1.sha256)(refreshToken), expiresAt: new Date(Date.now() + parseTtl(env_js_1.env.refreshTokenTtl)) } });
    return { accessToken, refreshToken };
}
async function logout(refreshToken) {
    const tokenHash = (0, hash_js_1.sha256)(refreshToken);
    await prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
    return { success: true };
}
function parseTtl(ttl) {
    const match = ttl.match(/^(\d+)([mhd])$/);
    if (!match)
        return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return value * 1000;
    }
}
