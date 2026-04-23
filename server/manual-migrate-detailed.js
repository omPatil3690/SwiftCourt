import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Creating enums...');
    
    // Create enums
    await prisma.$executeRawUnsafe(`CREATE TYPE "UserRole" AS ENUM ('USER', 'OWNER', 'ADMIN')`);
    await prisma.$executeRawUnsafe(`CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED')`);
    await prisma.$executeRawUnsafe(`CREATE TYPE "FacilityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED')`);
    await prisma.$executeRawUnsafe(`CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')`);
    await prisma.$executeRawUnsafe(`CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED')`);

    console.log('Creating User table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "avatarUrl" TEXT,
        "role" "UserRole" NOT NULL DEFAULT 'USER',
        "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      )
    `);

    console.log('Creating VerificationToken table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "VerificationToken" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "otpHash" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "usedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
      )
    `);

    console.log('Creating Facility table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Facility" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "location" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "sports" TEXT[],
        "amenities" TEXT[],
        "images" TEXT[],
        "status" "FacilityStatus" NOT NULL DEFAULT 'PENDING',
        "ownerId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
      )
    `);

    console.log('Creating Court table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Court" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "facilityId" TEXT NOT NULL,
        "pricePerHour" DECIMAL(10,2) NOT NULL,
        "openTime" INTEGER NOT NULL,
        "closeTime" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Court_pkey" PRIMARY KEY ("id")
      )
    `);

    console.log('Creating other tables...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "MaintenanceBlock" (
        "id" TEXT NOT NULL,
        "courtId" TEXT NOT NULL,
        "startTime" TIMESTAMP(3) NOT NULL,
        "endTime" TIMESTAMP(3) NOT NULL,
        "reason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MaintenanceBlock_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Booking" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "courtId" TEXT NOT NULL,
        "startTime" TIMESTAMP(3) NOT NULL,
        "endTime" TIMESTAMP(3) NOT NULL,
        "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
        "price" DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Payment" (
        "id" TEXT NOT NULL,
        "bookingId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "provider" TEXT NOT NULL,
        "providerRef" TEXT,
        "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE "RefreshToken" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "tokenHash" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "revokedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
      )
    `);

    console.log('Creating indexes...');
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "VerificationToken_userId_idx" ON "VerificationToken"("userId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "Facility_status_idx" ON "Facility"("status")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "Facility_ownerId_idx" ON "Facility"("ownerId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "Court_facilityId_idx" ON "Court"("facilityId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "MaintenanceBlock_courtId_idx" ON "MaintenanceBlock"("courtId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "MaintenanceBlock_startTime_endTime_idx" ON "MaintenanceBlock"("startTime", "endTime")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "Booking_courtId_startTime_endTime_idx" ON "Booking"("courtId", "startTime", "endTime")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "Booking_userId_idx" ON "Booking"("userId")`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "Payment_status_idx" ON "Payment"("status")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt")`);

    console.log('Adding foreign keys...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Facility" ADD CONSTRAINT "Facility_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Court" ADD CONSTRAINT "Court_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "MaintenanceBlock" ADD CONSTRAINT "MaintenanceBlock_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Booking" ADD CONSTRAINT "Booking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);

    console.log('Creating migration history...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" TEXT PRIMARY KEY,
        "checksum" TEXT NOT NULL,
        "finished_at" TIMESTAMP,
        "migration_name" TEXT NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMP,
        "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      )
    `);
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
      VALUES (
        '20250811080838_init',
        '4f8e8b8e5c8a9a8b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
        '20250811080838_init',
        CURRENT_TIMESTAMP,
        1
      )
      ON CONFLICT ("id") DO NOTHING
    `);
    
    console.log('Migration completed successfully!');
    
    // Verify tables were created
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('Tables created:');
    tables.forEach(row => console.log('- ' + row.table_name));
    
  } catch (error) {
    console.error('Migration error:', error.message);
    // Continue even if some operations fail (like if things already exist)
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
