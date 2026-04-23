import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// New default admin credentials (can be overridden with env vars)
// Requested: admin@gmail.com / Pre8isOG@
const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const fullName = process.env.ADMIN_FULL_NAME || 'QuickCourt Admin';
const password = process.env.ADMIN_PASSWORD || 'Pre8isOG@';

async function main() {
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    // Try exact email first
    let target = await prisma.user.findUnique({ where: { email } });

    if (target) {
      target = await prisma.user.update({
        where: { id: target.id },
        data: { passwordHash, role: 'ADMIN', status: 'ACTIVE', fullName }
      });
      console.log('Admin user (matched by email) updated:', { id: target.id, email: target.email });
    } else {
      // If no user with the desired email, see if an admin exists to repurpose
      const anyAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (anyAdmin) {
        target = await prisma.user.update({
          where: { id: anyAdmin.id },
          data: { email, passwordHash, fullName, status: 'ACTIVE' }
        });
        console.log('Existing admin account reassigned to new credentials:', { id: target.id, email: target.email });
      } else {
        target = await prisma.user.create({
          data: { email, fullName, passwordHash, role: 'ADMIN', status: 'ACTIVE' }
        });
        console.log('Admin user created:', { id: target.id, email: target.email });
      }
    }

    console.log('\nLogin credentials now set to:');
    console.log('  Email   :', email);
    console.log('  Password:', password);
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log('\nTip: Set ADMIN_EMAIL / ADMIN_PASSWORD env vars before running to customize without editing file.');
    }
  } catch (e) {
    console.error('Failed to create admin:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
