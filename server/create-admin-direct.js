const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Pre8isOG@';
    const fullName = process.env.ADMIN_FULL_NAME || 'QuickCourt Admin';

    console.log('🔨 Ensuring admin user...');

    // Attempt to find by desired email first
    let target = await prisma.user.findUnique({ where: { email: adminEmail } });

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    if (target) {
      target = await prisma.user.update({
        where: { id: target.id },
        data: { passwordHash, role: 'ADMIN', status: 'ACTIVE', fullName }
      });
      console.log('✅ Admin (matched by email) updated:', target.id);
    } else {
      // Fallback: any existing admin to reassign?
      const anyAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      if (anyAdmin) {
        target = await prisma.user.update({
          where: { id: anyAdmin.id },
          data: { email: adminEmail, passwordHash, fullName, status: 'ACTIVE' }
        });
        console.log('♻️  Existing admin reassigned to new credentials:', target.id);
      } else {
        target = await prisma.user.create({
          data: { email: adminEmail, passwordHash, fullName, role: 'ADMIN', status: 'ACTIVE' }
        });
        console.log('✅ Admin user created:', target.id);
      }
    }

    console.log('\nCurrent admin credentials:');
    console.log('📧 Email   :', adminEmail);
    console.log('🔑 Password:', adminPassword);
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log('Tip: Set ADMIN_EMAIL / ADMIN_PASSWORD env vars before running to customize without editing file.');
    }
    return target;
  } catch (error) {
    console.error('❌ Failed to create/update admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin().catch(console.error);
