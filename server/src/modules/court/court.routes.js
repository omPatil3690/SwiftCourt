"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courtRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const enums_js_1 = require("../../types/enums.js");
const zod_1 = require("zod");
const auth_js_1 = require("../../middleware/auth.js");
const prisma = new client_1.PrismaClient();
exports.courtRouter = (0, express_1.Router)();
const createCourtSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Court name must be at least 2 characters'),
    facilityId: zod_1.z.string().cuid('Invalid facility ID'),
    pricePerHour: zod_1.z.number().min(1, 'Price must be at least $1').max(1000, 'Price cannot exceed $1000'),
    openTime: zod_1.z.number().min(0).max(1439, 'Invalid opening time'), // minutes from midnight
    closeTime: zod_1.z.number().min(0).max(1439, 'Invalid closing time'),
}).refine(data => data.closeTime > data.openTime, {
    message: 'Closing time must be after opening time',
    path: ['closeTime']
});
const updateCourtSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Court name must be at least 2 characters').optional(),
    pricePerHour: zod_1.z.number().min(1, 'Price must be at least $1').max(1000, 'Price cannot exceed $1000').optional(),
    openTime: zod_1.z.number().min(0).max(1439, 'Invalid opening time').optional(),
    closeTime: zod_1.z.number().min(0).max(1439, 'Invalid closing time').optional(),
}).refine(data => {
    if (data.openTime !== undefined && data.closeTime !== undefined) {
        return data.closeTime > data.openTime;
    }
    return true;
}, {
    message: 'Closing time must be after opening time',
    path: ['closeTime']
});
// Create a new court (Owner only)
exports.courtRouter.post('/', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.OWNER), async (req, res) => {
    try {
        const data = createCourtSchema.parse(req.body);
        // Verify that the facility belongs to the authenticated user
        const facility = await prisma.facility.findFirst({
            where: {
                id: data.facilityId,
                ownerId: req.user.id
            }
        });
        if (!facility) {
            return res.status(404).json({ message: 'Facility not found or you do not have permission to add courts to this facility' });
        }
        const court = await prisma.court.create({
            data: {
                name: data.name,
                facilityId: data.facilityId,
                pricePerHour: data.pricePerHour,
                openTime: data.openTime,
                closeTime: data.closeTime,
            },
            include: {
                facility: {
                    select: {
                        name: true,
                        location: true
                    }
                }
            }
        });
        res.status(201).json(court);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Failed to create court:', error);
        res.status(500).json({ message: 'Failed to create court' });
    }
});
// Get courts for a specific facility
exports.courtRouter.get('/facility/:facilityId', async (req, res) => {
    try {
        const { facilityId } = req.params;
        const courts = await prisma.court.findMany({
            where: { facilityId },
            include: {
                facility: {
                    select: {
                        name: true,
                        location: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(courts);
    }
    catch (error) {
        console.error('Failed to fetch courts:', error);
        res.status(500).json({ message: 'Failed to fetch courts' });
    }
});
// Get owner's courts
exports.courtRouter.get('/owner', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.OWNER), async (req, res) => {
    try {
        const courts = await prisma.court.findMany({
            where: {
                facility: {
                    ownerId: req.user.id
                }
            },
            include: {
                facility: {
                    select: {
                        name: true,
                        location: true,
                        status: true
                    }
                },
                _count: {
                    select: {
                        bookings: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(courts);
    }
    catch (error) {
        console.error('Failed to fetch owner courts:', error);
        res.status(500).json({ message: 'Failed to fetch courts' });
    }
});
// Update a court (Owner only)
exports.courtRouter.put('/:id', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.OWNER), async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateCourtSchema.parse(req.body);
        // Verify that the court belongs to the authenticated user
        const existingCourt = await prisma.court.findFirst({
            where: {
                id,
                facility: {
                    ownerId: req.user.id
                }
            }
        });
        if (!existingCourt) {
            return res.status(404).json({ message: 'Court not found or you do not have permission to update this court' });
        }
        const court = await prisma.court.update({
            where: { id },
            data,
            include: {
                facility: {
                    select: {
                        name: true,
                        location: true
                    }
                }
            }
        });
        res.json(court);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors
            });
        }
        console.error('Failed to update court:', error);
        res.status(500).json({ message: 'Failed to update court' });
    }
});
// Delete a court (Owner only)
exports.courtRouter.delete('/:id', auth_js_1.requireAuth, (0, auth_js_1.requireRoles)(enums_js_1.UserRole.OWNER), async (req, res) => {
    try {
        const { id } = req.params;
        // Verify that the court belongs to the authenticated user
        const existingCourt = await prisma.court.findFirst({
            where: {
                id,
                facility: {
                    ownerId: req.user.id
                }
            }
        });
        if (!existingCourt) {
            return res.status(404).json({ message: 'Court not found or you do not have permission to delete this court' });
        }
        // Check if there are any future bookings
        const futureBookings = await prisma.booking.count({
            where: {
                courtId: id,
                startTime: {
                    gte: new Date()
                }
            }
        });
        if (futureBookings > 0) {
            return res.status(400).json({
                message: `Cannot delete court with ${futureBookings} future booking(s). Please cancel all future bookings first.`
            });
        }
        await prisma.court.delete({
            where: { id }
        });
        res.json({ message: 'Court deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete court:', error);
        res.status(500).json({ message: 'Failed to delete court' });
    }
});
// Get a specific court by ID
exports.courtRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const court = await prisma.court.findUnique({
            where: { id },
            include: {
                facility: {
                    select: {
                        name: true,
                        location: true,
                        status: true,
                        sports: true,
                        amenities: true
                    }
                }
            }
        });
        if (!court) {
            return res.status(404).json({ message: 'Court not found' });
        }
        res.json(court);
    }
    catch (error) {
        console.error('Failed to fetch court:', error);
        res.status(500).json({ message: 'Failed to fetch court' });
    }
});
exports.default = exports.courtRouter;
