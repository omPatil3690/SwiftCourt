import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, requireAuth, requireRoles } from '../../middleware/auth.js';
import { UserRole } from '../../types/enums.js';

const prisma = new PrismaClient();
const router = Router();

// Helpers
function formatDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatMonth(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}

function addMonths(d: Date, months: number) {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + months);
  return nd;
}

// Get dashboard statistics
router.get('/stats', requireAuth, requireRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalFacilities,
      totalBookings,
      pendingFacilities,
      activeBookings,
      totalRevenue,
      usersLastMonth,
      revenueLastMonth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.facility.count(),
      prisma.booking.count(),
      prisma.facility.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({
        _sum: { price: true },
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.booking.aggregate({
        _sum: { price: true },
        where: {
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const currentMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const currentMonthRevenue = await prisma.booking.aggregate({
      _sum: { price: true },
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const userGrowth = usersLastMonth > 0 
      ? ((currentMonthUsers - usersLastMonth) / usersLastMonth) * 100 
      : 0;

    const revenueGrowth = Number(revenueLastMonth._sum?.price || 0) > 0 
      ? (((Number(currentMonthRevenue._sum?.price || 0)) - Number(revenueLastMonth._sum?.price || 0)) / Number(revenueLastMonth._sum?.price || 1)) * 100 
      : 0;

    res.json({
      totalUsers,
      totalFacilities,
      totalBookings,
      totalRevenue: Number(totalRevenue._sum?.price || 0),
      pendingFacilities,
      activeBookings,
      userGrowth: Math.round(userGrowth * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Admin analytics (no hardcoded data). Returns timeseries and aggregates.
// Query: ?range=7d|30d|90d|12m (default 30d)
router.get('/analytics', requireAuth, requireRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const range = (String(req.query.range || '30d')) as '7d'|'30d'|'90d'|'12m';
    const now = new Date();
    let start: Date;
    let granularity: 'day' | 'month' = 'day';
    if (range === '7d') start = addDays(now, -6); // include today => 7 points
    else if (range === '30d') start = addDays(now, -29);
    else if (range === '90d') start = addDays(now, -89);
    else { // 12m
      granularity = 'month';
      start = addMonths(now, -11);
      start.setDate(1);
    }

    // Pre-build buckets
    const buckets: string[] = [];
    if (granularity === 'day') {
      for (let d = new Date(start); d <= now; d = addDays(d, 1)) {
        buckets.push(formatDay(d));
      }
    } else {
      for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= now; d = addMonths(d, 1)) {
        buckets.push(formatMonth(d));
      }
    }

    // Fetch raw data in range
    const [users, bookings, facilities] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: start, lte: now } },
        select: { id: true, role: true, createdAt: true }
      }),
      prisma.booking.findMany({
        where: { createdAt: { gte: start, lte: now } },
        select: { id: true, status: true, price: true, createdAt: true, court: { select: { facilityId: true } } }
      }),
      prisma.facility.findMany({
        select: { id: true, name: true, status: true }
      })
    ]);

    // Users time series
    const usersSeries = buckets.map((b) => ({ period: b, total: 0, USER: 0, OWNER: 0 }));
    let usersTotal = 0, ownersTotal = 0;
    for (const u of users) {
      const key = granularity === 'day' ? formatDay(u.createdAt) : formatMonth(u.createdAt);
      const idx = buckets.indexOf(key);
      if (idx !== -1) {
        usersSeries[idx].total += 1;
        // @ts-ignore role is string union
        usersSeries[idx][u.role] += 1;
      }
      if (u.role === 'OWNER') ownersTotal += 1; else usersTotal += 1;
    }

    // Bookings time series and revenue
    const bookingsSeries = buckets.map((b) => ({ period: b, total: 0, PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 }));
    const revenueSeries = buckets.map((b) => ({ period: b, amount: 0 }));
    let revenueTotal = 0;
    const facilityTotals: Record<string, { revenue: number; bookings: number }> = {};
    for (const b of bookings) {
      const key = granularity === 'day' ? formatDay(b.createdAt) : formatMonth(b.createdAt);
      const idx = buckets.indexOf(key);
      if (idx !== -1) {
        bookingsSeries[idx].total += 1;
        // @ts-ignore status key exists
        bookingsSeries[idx][b.status] += 1;
        const price = Number(b.price);
        if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
          revenueSeries[idx].amount += price;
          revenueTotal += price;
          const fid = b.court?.facilityId;
          if (fid) {
            facilityTotals[fid] = facilityTotals[fid] || { revenue: 0, bookings: 0 };
            facilityTotals[fid].revenue += price;
          }
        }
        const fid2 = b.court?.facilityId;
        if (fid2) {
          facilityTotals[fid2] = facilityTotals[fid2] || { revenue: 0, bookings: 0 };
          facilityTotals[fid2].bookings += 1;
        }
      }
    }

    // Facilities distribution
    const facilitiesByStatus = facilities.reduce((acc: Record<string, number>, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top facilities by revenue/bookings in the range
    const topFacilities = Object.entries(facilityTotals)
      .map(([facilityId, v]) => {
        const f = facilities.find(ff => ff.id === facilityId);
        return { id: facilityId, name: f?.name || 'Unknown', revenue: v.revenue, bookings: v.bookings };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      range,
      granularity,
      users: {
        total: users.length,
        byRole: { USER: usersTotal, OWNER: ownersTotal, ADMIN: 0 },
        timeSeries: usersSeries
      },
      bookings: {
        total: bookings.length,
        byStatus: bookingsSeries.reduce((acc, cur) => {
          acc.PENDING += cur.PENDING; acc.CONFIRMED += cur.CONFIRMED; acc.COMPLETED += cur.COMPLETED; acc.CANCELLED += cur.CANCELLED; return acc;
        }, { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 } as any),
        timeSeries: bookingsSeries
      },
      revenue: {
        total: revenueTotal,
        timeSeries: revenueSeries
      },
      facilities: {
        total: facilities.length,
        byStatus: facilitiesByStatus
      },
      topFacilities
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get all users with counts
router.get('/users', requireAuth, requireRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            bookings: true,
            facilities: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all facilities with owner info
router.get('/facilities', requireAuth, requireRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        _count: {
          select: {
            courts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add a fake pricePerHour field for compatibility
    const facilitiesWithPrice = facilities.map(facility => ({
      ...facility,
      pricePerHour: 50, // Default price since it's stored per court
      _count: {
        ...facility._count,
        bookings: 0 // We'll calculate this separately if needed
      }
    }));

    res.json(facilitiesWithPrice);
  } catch (error) {
    console.error('Failed to fetch facilities:', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

// Get all bookings with user and facility info
router.get('/bookings', requireAuth, requireRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        court: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                location: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to recent 100 bookings for performance
    });

    // Transform bookings to match expected format
    const transformedBookings = bookings.map((booking: any) => ({
      id: booking.id,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: Number(booking.price),
      status: booking.status,
      createdAt: booking.createdAt,
      user: booking.user,
      facility: {
        id: booking.court.facility.id,
        name: booking.court.facility.name,
        location: booking.court.facility.location
      }
    }));

    res.json(transformedBookings);
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Approve facility
router.put('/facilities/:id/approve', requireAuth, requireRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const facility = await prisma.facility.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        owner: {
          select: { email: true, fullName: true }
        }
      }
    });

    // TODO: Send approval email to facility owner
    console.log(`Facility ${facility.name} approved for ${facility.owner.fullName}`);

    res.json({ message: 'Facility approved successfully', facility });
  } catch (error) {
    console.error('Failed to approve facility:', error);
    res.status(500).json({ error: 'Failed to approve facility' });
  }
});

// Reject facility
router.put('/facilities/:id/reject', requireAuth, requireRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const facility = await prisma.facility.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        owner: {
          select: { email: true, fullName: true }
        }
      }
    });

    // TODO: Send rejection email to facility owner with reason
    console.log(`Facility ${facility.name} rejected for ${facility.owner.fullName}. Reason: ${reason}`);

    res.json({ message: 'Facility rejected', facility });
  } catch (error) {
    console.error('Failed to reject facility:', error);
    res.status(500).json({ error: 'Failed to reject facility' });
  }
});

// Ban user
router.put('/users/:id/ban', requireAuth, requireRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'BANNED' }
    });

    // TODO: Send ban notification email
    console.log(`User ${user.fullName} banned. Reason: ${reason}`);

    res.json({ message: 'User banned successfully', user });
  } catch (error) {
    console.error('Failed to ban user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Unban user
router.put('/users/:id/unban', requireAuth, requireRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    // TODO: Send unban notification email
    console.log(`User ${user.fullName} unbanned`);

    res.json({ message: 'User unbanned successfully', user });
  } catch (error) {
    console.error('Failed to unban user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

export { router as adminRouter };
