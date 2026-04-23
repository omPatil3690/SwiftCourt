import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { PaymentController } from './payment.controller.js';

const router = Router();

// Create Razorpay order for a booking
router.post('/orders', requireAuth, PaymentController.createOrder);

// Verify payment after successful payment
router.post('/verify', requireAuth, PaymentController.verifyPayment);

// Get payment status for a booking
router.get('/booking/:bookingId/status', requireAuth, PaymentController.getPaymentStatus);

// Public config for frontend (exposes only public key id)
router.get('/config', PaymentController.getConfig);

// Initiate refund for a payment
router.post('/refund', requireAuth, PaymentController.initiateRefund);

// Webhook endpoint for Razorpay events (no auth required)
router.post('/webhook', PaymentController.handleWebhook);

export default router;
