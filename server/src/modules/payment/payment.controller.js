"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const razorpay_1 = require("../../services/razorpay");
const enums_js_1 = require("../../types/enums.js");
const prisma = new client_1.PrismaClient();
// Validation schemas
const createPaymentOrderSchema = zod_1.z.object({
    bookingId: zod_1.z.string().min(1, 'Booking ID is required'),
});
const verifyPaymentSchema = zod_1.z.object({
    razorpay_order_id: zod_1.z.string().min(1, 'Order ID is required'),
    razorpay_payment_id: zod_1.z.string().min(1, 'Payment ID is required'),
    razorpay_signature: zod_1.z.string().min(1, 'Signature is required'),
    bookingId: zod_1.z.string().min(1, 'Booking ID is required'),
});
const initiateRefundSchema = zod_1.z.object({
    paymentId: zod_1.z.string().min(1, 'Payment ID is required'),
    reason: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive().optional(),
});
class PaymentController {
    /**
     * Public config for frontend: exposes Razorpay public key
     */
    static async getConfig(req, res) {
        try {
            // Only expose the public key id
            const keyId = process.env.RAZORPAY_KEY_ID || '';
            if (!keyId) {
                return res.status(500).json({ success: false, message: 'Razorpay key not configured' });
            }
            res.json({ success: true, data: { keyId } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'Failed to load payment config' });
        }
    }
    /**
     * Create Razorpay order for a booking
     */
    static async createOrder(req, res) {
        try {
            const { bookingId } = createPaymentOrderSchema.parse(req.body);
            const userId = req.user.id;
            // Fetch booking with court and facility details
            const booking = await prisma.booking.findFirst({
                where: {
                    id: bookingId,
                    userId: userId,
                    status: enums_js_1.BookingStatus.PENDING,
                },
                include: {
                    court: {
                        include: {
                            facility: true,
                        },
                    },
                    payment: true,
                },
            });
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found or already processed',
                });
            }
            // Check if payment already exists for this booking
            if (booking.payment) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment already initiated for this booking',
                });
            }
            // Convert amount to paise (Razorpay uses smallest currency unit)
            const amountInPaise = razorpay_1.RazorpayService.rupeesToPaise(Number(booking.price));
            // Create Razorpay order
            const receiptId = razorpay_1.RazorpayService.generateReceiptId('booking');
            const razorpayOrder = await razorpay_1.RazorpayService.createOrder({
                amount: amountInPaise,
                receipt: receiptId,
                notes: {
                    bookingId: booking.id,
                    userId: userId,
                    facilityName: booking.court.facility.name,
                    courtName: booking.court.name,
                    startTime: booking.startTime.toISOString(),
                    endTime: booking.endTime.toISOString(),
                },
            });
            // Create payment record
            const payment = await prisma.payment.create({
                data: {
                    bookingId: booking.id,
                    amount: booking.price,
                    provider: 'razorpay',
                    providerRef: razorpayOrder.id,
                    status: enums_js_1.PaymentStatus.PENDING,
                },
            });
            res.json({
                success: true,
                data: {
                    orderId: razorpayOrder.id,
                    amount: amountInPaise,
                    currency: razorpayOrder.currency,
                    receipt: razorpayOrder.receipt,
                    booking: {
                        id: booking.id,
                        facilityName: booking.court.facility.name,
                        courtName: booking.court.name,
                        startTime: booking.startTime,
                        endTime: booking.endTime,
                        price: booking.price,
                    },
                },
            });
        }
        catch (error) {
            console.error('Create payment order error:', error);
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors,
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to create payment order',
            });
        }
    }
    /**
     * Verify payment and update booking status
     */
    static async verifyPayment(req, res) {
        try {
            const paymentData = verifyPaymentSchema.parse(req.body);
            const userId = req.user.id;
            // Verify payment signature
            const isValidSignature = razorpay_1.RazorpayService.verifyPaymentSignature(paymentData);
            if (!isValidSignature) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment signature',
                });
            }
            // Fetch booking and payment
            const booking = await prisma.booking.findFirst({
                where: {
                    id: paymentData.bookingId,
                    userId: userId,
                },
                include: {
                    payment: true,
                    court: {
                        include: {
                            facility: true,
                        },
                    },
                },
            });
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: 'Booking not found',
                });
            }
            if (!booking.payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment record not found',
                });
            }
            // Verify the order ID matches our payment record
            if (booking.payment.providerRef !== paymentData.razorpay_order_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Order ID mismatch',
                });
            }
            // Get payment details from Razorpay
            const razorpayPayment = await razorpay_1.RazorpayService.getPayment(paymentData.razorpay_payment_id);
            // Update payment and booking status in a transaction
            const result = await prisma.$transaction(async (tx) => {
                // Update payment status
                const updatedPayment = await tx.payment.update({
                    where: { id: booking.payment.id },
                    data: {
                        status: razorpayPayment.status === 'captured'
                            ? enums_js_1.PaymentStatus.SUCCEEDED
                            : enums_js_1.PaymentStatus.PENDING,
                    },
                });
                // Update booking status
                const updatedBooking = await tx.booking.update({
                    where: { id: booking.id },
                    data: {
                        status: razorpayPayment.status === 'captured'
                            ? enums_js_1.BookingStatus.CONFIRMED
                            : enums_js_1.BookingStatus.PENDING,
                    },
                });
                return { payment: updatedPayment, booking: updatedBooking };
            });
            res.json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    bookingId: booking.id,
                    paymentStatus: result.payment.status,
                    bookingStatus: result.booking.status,
                    paymentId: paymentData.razorpay_payment_id,
                },
            });
        }
        catch (error) {
            console.error('Payment verification error:', error);
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors,
                });
            }
            res.status(500).json({
                success: false,
                message: 'Payment verification failed',
            });
        }
    }
    /**
     * Get payment status for a booking
     */
    static async getPaymentStatus(req, res) {
        try {
            const { bookingId } = req.params;
            const userId = req.user.id;
            const payment = await prisma.payment.findFirst({
                where: {
                    booking: {
                        id: bookingId,
                        userId: userId,
                    },
                },
                include: {
                    booking: {
                        select: {
                            id: true,
                            status: true,
                            price: true,
                            startTime: true,
                            endTime: true,
                        },
                    },
                },
            });
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found',
                });
            }
            res.json({
                success: true,
                data: {
                    paymentId: payment.id,
                    amount: payment.amount,
                    status: payment.status,
                    provider: payment.provider,
                    createdAt: payment.createdAt,
                    booking: payment.booking,
                },
            });
        }
        catch (error) {
            console.error('Get payment status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch payment status',
            });
        }
    }
    /**
     * Initiate refund for a payment
     */
    static async initiateRefund(req, res) {
        try {
            const { paymentId, reason, amount } = initiateRefundSchema.parse(req.body);
            const userId = req.user.id;
            // Find the payment and verify ownership
            const payment = await prisma.payment.findFirst({
                where: {
                    id: paymentId,
                    booking: {
                        userId: userId,
                    },
                    status: enums_js_1.PaymentStatus.SUCCEEDED,
                },
                include: {
                    booking: {
                        include: {
                            court: {
                                include: {
                                    facility: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!payment) {
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found or cannot be refunded',
                });
            }
            // Check if booking can be cancelled (e.g., not in the past)
            const now = new Date();
            const bookingStart = new Date(payment.booking.startTime);
            if (bookingStart <= now) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot refund for past bookings',
                });
            }
            // Initiate refund with Razorpay
            const refundAmount = amount ? razorpay_1.RazorpayService.rupeesToPaise(amount) : undefined;
            // We need to get the razorpay payment ID from the provider reference
            // This assumes the payment was made through our verify endpoint
            // In a real scenario, you'd store the payment ID during verification
            const razorpayPaymentId = payment.providerRef;
            if (!razorpayPaymentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment reference not found',
                });
            }
            const refund = await razorpay_1.RazorpayService.initiateRefund(razorpayPaymentId, refundAmount, {
                bookingId: payment.booking.id,
                reason: reason || 'Booking cancellation',
                userId: userId,
            });
            // Update payment status
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: enums_js_1.PaymentStatus.REFUNDED,
                },
            });
            // Update booking status
            await prisma.booking.update({
                where: { id: payment.booking.id },
                data: {
                    status: enums_js_1.BookingStatus.CANCELLED,
                },
            });
            res.json({
                success: true,
                message: 'Refund initiated successfully',
                data: {
                    refundId: refund.id,
                    amount: refund.amount ? razorpay_1.RazorpayService.paiseToRupees(refund.amount) : 0,
                    status: refund.status,
                },
            });
        }
        catch (error) {
            console.error('Initiate refund error:', error);
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors,
                });
            }
            res.status(500).json({
                success: false,
                message: 'Failed to initiate refund',
            });
        }
    }
    /**
     * Handle Razorpay webhooks
     */
    static async handleWebhook(req, res) {
        try {
            const signature = req.headers['x-razorpay-signature'];
            const body = JSON.stringify(req.body);
            if (!signature) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing webhook signature',
                });
            }
            // Verify webhook signature
            const isValidWebhook = razorpay_1.RazorpayService.verifyWebhookSignature(body, signature);
            if (!isValidWebhook) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid webhook signature',
                });
            }
            const event = req.body;
            switch (event.event) {
                case 'payment.captured':
                    await handlePaymentCaptured(event.payload.payment.entity);
                    break;
                case 'payment.failed':
                    await handlePaymentFailed(event.payload.payment.entity);
                    break;
                case 'order.paid':
                    await handleOrderPaid(event.payload.order.entity);
                    break;
                case 'refund.processed':
                    await handleRefundProcessed(event.payload.refund.entity);
                    break;
                default:
                    console.log(`Unhandled webhook event: ${event.event}`);
            }
            res.json({ success: true });
        }
        catch (error) {
            console.error('Webhook handling error:', error);
            res.status(500).json({
                success: false,
                message: 'Webhook processing failed',
            });
        }
    }
}
exports.PaymentController = PaymentController;
// Helper functions for webhook event handling
async function handlePaymentCaptured(payment) {
    try {
        // Find the payment by order ID
        const paymentRecord = await prisma.payment.findFirst({
            where: {
                providerRef: payment.order_id,
            },
        });
        if (paymentRecord) {
            await prisma.$transaction(async (tx) => {
                // Update payment status
                await tx.payment.update({
                    where: { id: paymentRecord.id },
                    data: { status: enums_js_1.PaymentStatus.SUCCEEDED },
                });
                // Update booking status
                await tx.booking.update({
                    where: { id: paymentRecord.bookingId },
                    data: { status: enums_js_1.BookingStatus.CONFIRMED },
                });
            });
            console.log(`Payment captured for booking: ${paymentRecord.bookingId}`);
        }
    }
    catch (error) {
        console.error('Handle payment captured error:', error);
    }
}
async function handlePaymentFailed(payment) {
    try {
        const paymentRecord = await prisma.payment.findFirst({
            where: {
                providerRef: payment.order_id,
            },
        });
        if (paymentRecord) {
            await prisma.$transaction(async (tx) => {
                await tx.payment.update({
                    where: { id: paymentRecord.id },
                    data: { status: enums_js_1.PaymentStatus.FAILED },
                });
                await tx.booking.update({
                    where: { id: paymentRecord.bookingId },
                    data: { status: enums_js_1.BookingStatus.CANCELLED },
                });
            });
            console.log(`Payment failed for booking: ${paymentRecord.bookingId}`);
        }
    }
    catch (error) {
        console.error('Handle payment failed error:', error);
    }
}
async function handleOrderPaid(order) {
    try {
        console.log(`Order paid: ${order.id}`);
        // Additional logic if needed
    }
    catch (error) {
        console.error('Handle order paid error:', error);
    }
}
async function handleRefundProcessed(refund) {
    try {
        console.log(`Refund processed: ${refund.id}, amount: ${refund.amount}`);
        // Additional logic if needed
    }
    catch (error) {
        console.error('Handle refund processed error:', error);
    }
}
