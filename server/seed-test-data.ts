import { PrismaClient, FacilityStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface CourtData {
  name: string;
  pricePerHour: number;
  openTime: number;
  closeTime: number;
}

// Simple hash function for demo purposes (use bcrypt in production)
function simpleHash(password: string): string {
  return crypto.createHash('sha256').update(password + 'salt').digest('hex');
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create a test owner user
    const passwordHash = simpleHash('testowner123');
    
    const testOwner = await prisma.user.upsert({
      where: { email: 'owner@quickcourt.com' },
      update: {},
      create: {
        email: 'owner@quickcourt.com',
        passwordHash,
        fullName: 'Test Owner',
        role: 'OWNER',
        status: 'ACTIVE'
      }
    });

    // Create a test user for booking
    const userPasswordHash = simpleHash('testuser123');
    
    const testUser = await prisma.user.upsert({
      where: { email: 'user@quickcourt.com' },
      update: {},
      create: {
        email: 'user@quickcourt.com',
        passwordHash: userPasswordHash,
        fullName: 'Test User',
        role: 'USER',
        status: 'ACTIVE'
      }
    });

    // Create sample facilities
    const facilities = [
      {
        name: 'Mumbai Sports Club',
        location: 'Bandra West, Mumbai',
        description: 'Premium sports facility with world-class courts and amenities',
        sports: ['Tennis', 'Badminton', 'Squash'],
        amenities: ['Parking', 'Locker Rooms', 'Cafeteria', 'Air Conditioning', 'WiFi'],
        images: [
          'https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?w=800',
          'https://images.unsplash.com/photo-1588686679136-5d13b8b46488?w=800'
        ],
        status: 'APPROVED' as FacilityStatus,
        ownerId: testOwner.id
      },
      {
        name: 'Elite Badminton Center',
        location: 'Koramangala, Bangalore',
        description: 'State-of-the-art badminton courts with professional lighting',
        sports: ['Badminton'],
        amenities: ['Parking', 'Locker Rooms', 'Equipment Rental', 'Refreshments'],
        images: [
          'https://images.unsplash.com/photo-1626844131082-256783844137?w=800',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
        ],
        status: 'APPROVED' as FacilityStatus,
        ownerId: testOwner.id
      },
      {
        name: 'Green Valley Tennis Academy',
        location: 'Sector 18, Gurgaon',
        description: 'Professional tennis courts in a serene environment',
        sports: ['Tennis'],
        amenities: ['Parking', 'Coaching Available', 'Equipment Rental', 'Refreshments', 'WiFi'],
        images: [
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
          'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800'
        ],
        status: 'APPROVED' as FacilityStatus,
        ownerId: testOwner.id
      },
      {
        name: 'City Squash Complex',
        location: 'CP, New Delhi',
        description: 'Modern squash courts in the heart of the city',
        sports: ['Squash'],
        amenities: ['Parking', 'Locker Rooms', 'Air Conditioning', 'Refreshments'],
        images: [
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
          'https://images.unsplash.com/photo-1594736797933-d0d64f86e6d0?w=800'
        ],
        status: 'APPROVED' as FacilityStatus,
        ownerId: testOwner.id
      }
    ];

    // Create facilities and their courts
    for (const facilityData of facilities) {
      const facility = await prisma.facility.upsert({
        where: { 
          id: `facility_${facilityData.name.toLowerCase().replace(/\s+/g, '_')}` 
        },
        update: {},
        create: {
          id: `facility_${facilityData.name.toLowerCase().replace(/\s+/g, '_')}`,
          ...facilityData
        }
      });

      // Create courts for each facility
      const courts: CourtData[] = [];
      if (facilityData.sports.includes('Tennis')) {
        courts.push(
          { name: 'Tennis Court 1', pricePerHour: 800, openTime: 360, closeTime: 1320 }, // 6 AM to 10 PM
          { name: 'Tennis Court 2', pricePerHour: 800, openTime: 360, closeTime: 1320 }
        );
      }
      if (facilityData.sports.includes('Badminton')) {
        courts.push(
          { name: 'Badminton Court 1', pricePerHour: 500, openTime: 300, closeTime: 1380 }, // 5 AM to 11 PM
          { name: 'Badminton Court 2', pricePerHour: 500, openTime: 300, closeTime: 1380 },
          { name: 'Badminton Court 3', pricePerHour: 600, openTime: 300, closeTime: 1380 }
        );
      }
      if (facilityData.sports.includes('Squash')) {
        courts.push(
          { name: 'Squash Court 1', pricePerHour: 700, openTime: 360, closeTime: 1320 },
          { name: 'Squash Court 2', pricePerHour: 700, openTime: 360, closeTime: 1320 }
        );
      }

      for (const courtData of courts) {
        await prisma.court.upsert({
          where: {
            id: `court_${facility.id}_${courtData.name.toLowerCase().replace(/\s+/g, '_')}`
          },
          update: {},
          create: {
            id: `court_${facility.id}_${courtData.name.toLowerCase().replace(/\s+/g, '_')}`,
            name: courtData.name,
            facilityId: facility.id,
            pricePerHour: courtData.pricePerHour,
            openTime: courtData.openTime,
            closeTime: courtData.closeTime
          }
        });
      }

      // Add some sample reviews
      await prisma.review.upsert({
        where: {
          userId_facilityId: {
            userId: testUser.id,
            facilityId: facility.id
          }
        },
        update: {},
        create: {
          userId: testUser.id,
          facilityId: facility.id,
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
          comment: 'Great facility! Really enjoyed playing here.',
          sport: facilityData.sports[0],
          isVerified: true
        }
      });

      console.log(`✅ Created facility: ${facility.name} with ${courts.length} courts`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`
📋 Test Accounts Created:
👨‍💼 Owner: owner@quickcourt.com / testowner123
👤 User: user@quickcourt.com / testuser123

🏟️ Facilities Created:
- Mumbai Sports Club (Tennis, Badminton, Squash)
- Elite Badminton Center (Badminton)
- Green Valley Tennis Academy (Tennis)  
- City Squash Complex (Squash)

💡 You can now test bookings at: http://localhost:8080/play
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});
