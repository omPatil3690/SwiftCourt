import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createOwnerUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('Owner@12345!', 12);

    // Create owner user
    const owner = await prisma.user.create({
      data: {
        email: 'owner@quickcourt.com',
        name: 'John Owner',
        password: hashedPassword,
        phone: '+1234567890',
        role: 'OWNER',
        isVerified: true,
      },
    });

    console.log('Owner user created successfully:', {
      id: owner.id,
      email: owner.email,
      name: owner.name,
      role: owner.role,
    });

    console.log('\nLogin credentials:');
    console.log('Email: owner@quickcourt.com');
    console.log('Password: Owner@12345!');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Owner user already exists with this email');
    } else {
      console.error('Error creating owner user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createOwnerUser();
