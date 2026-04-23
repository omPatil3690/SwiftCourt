import { PrismaClient } from '@prisma/client';
import { UserRole } from '../../types/enums.js';
import { hashPassword, sha256, verifyPassword } from '../../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { env } from '../../config/env.js';

const prisma = new PrismaClient();

export async function registerUser(params: { email: string; password: string; fullName: string; role: UserRole; avatarUrl?: string }) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) throw new Error('Email already registered');
  const passwordHash = await hashPassword(params.password);
  const user = await prisma.user.create({ data: { email: params.email, passwordHash, fullName: params.fullName, role: params.role, avatarUrl: params.avatarUrl } });
  // OTP logic removed
  return { userId: user.id };
}


export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');
  if (user.status === 'BANNED') throw new Error('User banned');
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  const tokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + parseTtl(env.refreshTokenTtl));
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(oldToken: string) {
  let payload;
  try { payload = verifyRefreshToken(oldToken); } catch { throw new Error('Invalid token'); }
  const tokenHash = sha256(oldToken);
  const existing = await prisma.refreshToken.findFirst({ where: { tokenHash, revokedAt: null } });
  if (!existing) throw new Error('Token revoked');
  if (existing.expiresAt < new Date()) throw new Error('Token expired');
  await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
  const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
  const refreshToken = signRefreshToken({ sub: payload.sub, role: payload.role });
  await prisma.refreshToken.create({ data: { userId: payload.sub, tokenHash: sha256(refreshToken), expiresAt: new Date(Date.now() + parseTtl(env.refreshTokenTtl)) } });
  return { accessToken, refreshToken };
}

export async function logout(refreshToken: string) {
  const tokenHash = sha256(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
  return { success: true };
}

function parseTtl(ttl: string): number {
  const match = ttl.match(/^(\d+)([mhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return value * 1000;
  }
}
