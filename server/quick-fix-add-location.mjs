import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Ensuring Facility.location column exists and is NOT NULL...');
    await prisma.$executeRawUnsafe('ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "location" TEXT;');
    await prisma.$executeRawUnsafe('UPDATE "Facility" SET "location" = COALESCE("location", \'\') WHERE "location" IS NULL;');
    await prisma.$executeRawUnsafe('ALTER TABLE "Facility" ALTER COLUMN "location" SET NOT NULL;');
    console.log('Done.');
  } catch (e) {
    console.error('Quick fix failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
