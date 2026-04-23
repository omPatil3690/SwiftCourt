import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cols = ['address','city','email','phone','state','zipCode'];

async function run() {
  try {
    for (const col of cols) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Facility" ALTER COLUMN "${col}" DROP NOT NULL`);
        console.log(`Made Facility.${col} nullable`);
      } catch (e) {
        if (String(e.message || e).includes('does not exist')) {
          console.log(`Column Facility.${col} not present, skipping`);
        } else {
          console.log(`Skipping Facility.${col}:`, e.message || e);
        }
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

run();
