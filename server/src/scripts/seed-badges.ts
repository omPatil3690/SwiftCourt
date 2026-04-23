import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const badges = [
    { code: 'FIRST_BOOKING', name: 'First Booking', description: 'Completed your first booking', criteria: { minTotalBookings: 1 } },
    { code: 'BOOKING_10', name: '10 Bookings', description: 'Completed 10 bookings', criteria: { minTotalBookings: 10 } },
    { code: 'STREAK_3', name: '3-Day Streak', description: 'Active 3 day streak', criteria: { minStreak: 3 } }
  ];
  for (const b of badges) {
    const existing = await prisma.badge.findUnique({ where: { code: b.code } });
    if (!existing) {
      await prisma.badge.create({ data: b });
      console.log('Created badge', b.code);
    } else {
      console.log('Skipping existing badge', b.code);
    }
  }
}

main().then(() => { console.log('Badge seeding complete'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
