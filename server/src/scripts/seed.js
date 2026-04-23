"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function pickMany(arr, min, max) {
    const count = randInt(min, max);
    const copy = [...arr];
    const out = [];
    for (let i = 0; i < count && copy.length; i++) {
        const idx = randInt(0, copy.length - 1);
        out.push(copy.splice(idx, 1)[0]);
    }
    return out;
}
const SPORTS = ['Badminton', 'Tennis', 'Squash', 'Table Tennis', 'Basketball', 'Football'];
const AMENITIES = ['Parking', 'Water', 'Locker', 'Shower', 'Restroom', 'Cafeteria', 'First Aid'];
const CITY_PARTS = ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'JP Nagar', 'MG Road', 'Baner', 'Andheri', 'Powai'];
const IMG = (id) => `https://picsum.photos/seed/qc${id}/800/600`;
async function resetDatabase() {
    console.log('Resetting database...');
    // Order matters due to FK constraints
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.maintenanceBlock.deleteMany();
    await prisma.court.deleteMany();
    await prisma.facility.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
}
async function main() {
    const shouldReset = process.env.SEED_RESET !== 'false';
    if (shouldReset) {
        await resetDatabase();
    }
    const password = 'Passw0rd!';
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    // Create owners
    const ownerCount = 5;
    const owners = [];
    for (let i = 1; i <= ownerCount; i++) {
        const owner = await prisma.user.create({
            data: {
                email: `owner${i}@example.com`,
                passwordHash,
                fullName: `Owner ${i}`,
                role: client_1.UserRole.OWNER,
                avatarUrl: `https://i.pravatar.cc/150?img=${10 + i}`,
                status: 'ACTIVE',
            },
            select: { id: true, fullName: true },
        });
        owners.push(owner);
    }
    // Create users
    const userCount = 20;
    const users = [];
    for (let i = 1; i <= userCount; i++) {
        const u = await prisma.user.create({
            data: {
                email: `user${i}@example.com`,
                passwordHash,
                fullName: `Test User ${i}`,
                role: client_1.UserRole.USER,
                avatarUrl: `https://i.pravatar.cc/150?img=${30 + i}`,
                status: 'ACTIVE',
            },
            select: { id: true, fullName: true },
        });
        users.push(u);
    }
    // Optionally admin
    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            passwordHash,
            fullName: 'Admin User',
            role: client_1.UserRole.ADMIN,
            avatarUrl: `https://i.pravatar.cc/150?img=5`,
            status: 'ACTIVE',
        },
    });
    // Facilities and courts
    const facilities = [];
    const courts = [];
    let imgSeed = 1;
    for (const owner of owners) {
        const facilitiesPerOwner = randInt(1, 3);
        for (let i = 1; i <= facilitiesPerOwner; i++) {
            const sports = pickMany(SPORTS, 1, 3);
            const amen = pickMany(AMENITIES, 2, 5);
            const images = [IMG(imgSeed++), IMG(imgSeed++), IMG(imgSeed++)];
            const fac = await prisma.facility.create({
                data: {
                    name: `${owner.fullName.split(' ')[0]}'s ${pick(['Arena', 'Sports Hub', 'Court Center', 'Play Zone'])} ${i}`,
                    location: `${pick(CITY_PARTS)}, ${pick(['Bengaluru', 'Mumbai', 'Pune', 'Hyderabad'])}`,
                    description: 'A great place to play and practice. Clean courts and friendly staff.',
                    sports,
                    amenities: amen,
                    images,
                    status: client_1.FacilityStatus.APPROVED,
                    ownerId: owner.id,
                },
                select: { id: true },
            });
            facilities.push({ id: fac.id, ownerId: owner.id });
            // Courts for this facility
            const courtCount = randInt(2, 4);
            for (let c = 1; c <= courtCount; c++) {
                const price = String(randInt(200, 800)); // as string for Decimal
                const openTime = pick([6 * 60, 7 * 60, 8 * 60]);
                const closeTime = pick([22 * 60, 23 * 60]);
                const court = await prisma.court.create({
                    data: {
                        name: `Court ${c}`,
                        facilityId: fac.id,
                        pricePerHour: price,
                        openTime,
                        closeTime,
                    },
                    select: { id: true, facilityId: true },
                });
                courts.push({ id: court.id, facilityId: court.facilityId, pricePerHour: price });
            }
        }
    }
    // Bookings and payments
    const bookings = [];
    const bookingCount = 60;
    // Track per-court schedule to avoid overlaps roughly
    const schedule = new Map();
    for (let i = 0; i < bookingCount; i++) {
        const user = pick(users);
        const court = pick(courts);
        // pick a date within +/- 14 days
        const dayOffset = randInt(-10, 14);
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + dayOffset);
        // align to hour within court open/close
        const open = pick([6, 7, 8]);
        const startHour = randInt(open, 21);
        const durationHours = pick([1, 1, 2]);
        const start = new Date(date);
        start.setHours(startHour, 0, 0, 0);
        const end = new Date(start);
        end.setHours(startHour + durationHours);
        // simple non-overlap check
        const arr = schedule.get(court.id) || [];
        const overlaps = arr.some((b) => !(end <= b.start || start >= b.end));
        if (overlaps) {
            i--; // retry
            continue;
        }
        arr.push({ start, end });
        schedule.set(court.id, arr);
        const status = pick([client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.PENDING, client_1.BookingStatus.CANCELLED, client_1.BookingStatus.COMPLETED]);
        const price = String(Number(court.pricePerHour) * durationHours);
        const booking = await prisma.booking.create({
            data: {
                userId: user.id,
                courtId: court.id,
                startTime: start,
                endTime: end,
                status,
                price,
            },
            select: { id: true, userId: true, courtId: true },
        });
        bookings.push({ id: booking.id, userId: booking.userId, courtId: booking.courtId, price });
        // Payment for some bookings
        if (status === client_1.BookingStatus.CONFIRMED || status === client_1.BookingStatus.COMPLETED) {
            await prisma.payment.create({
                data: {
                    bookingId: booking.id,
                    amount: price,
                    provider: pick(['stripe', 'razorpay']),
                    providerRef: `txn_${Math.random().toString(36).slice(2, 10)}`,
                    status: pick([client_1.PaymentStatus.SUCCEEDED, client_1.PaymentStatus.SUCCEEDED, client_1.PaymentStatus.PENDING]),
                },
            });
        }
    }
    // Reviews: only for users who booked a facility
    const facilityByCourt = new Map();
    for (const c of courts)
        facilityByCourt.set(c.id, c.facilityId);
    const reviewed = new Set(); // key: userId|facilityId
    const reviewCount = 40;
    for (let i = 0; i < reviewCount; i++) {
        const b = pick(bookings);
        const facilityId = facilityByCourt.get(b.courtId);
        const key = `${b.userId}|${facilityId}`;
        if (reviewed.has(key)) {
            i--;
            continue;
        }
        reviewed.add(key);
        await prisma.review.create({
            data: {
                userId: b.userId,
                facilityId,
                rating: pick([3, 4, 5, 5, 4, 5]),
                comment: pick([
                    'Great courts and friendly staff!',
                    'Clean facility, had a good session.',
                    'Affordable and well-maintained.',
                    'Lights could be better but overall nice.',
                    'Booking was smooth and hassle-free.'
                ]),
                sport: pick(SPORTS),
                isVerified: true,
            },
        });
    }
    console.log('Seeding complete:', {
        owners: owners.length,
        users: users.length,
        facilities: facilities.length,
        courts: courts.length,
        bookings: bookings.length,
    });
}
main()
    .catch((e) => {
    console.error('Seed failed:', e);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
