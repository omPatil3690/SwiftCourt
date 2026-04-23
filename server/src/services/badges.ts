import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function evaluateUserBadges(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const totalBookings = await prisma.booking.count({ where: { userId, status: 'CONFIRMED' } });
  const currentStreak = user.currentStreak || 0;
  const badges = await prisma.badge.findMany({ where: { active: true } });
  const owned = new Set((await prisma.userBadge.findMany({ where: { userId } })).map(b => b.badgeId));
  for (const badge of badges) {
    const criteria: any = badge.criteria || {};
    if (criteria.minTotalBookings && totalBookings < criteria.minTotalBookings) continue;
    if (criteria.minStreak && currentStreak < criteria.minStreak) continue;
    if (!owned.has(badge.id)) {
      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
    }
  }
}

export async function evaluateAllBadges() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await evaluateUserBadges(u.id);
  }
}
