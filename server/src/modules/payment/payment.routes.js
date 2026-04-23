"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../../middleware/auth.js");
const payment_controller_js_1 = require("./payment.controller.js");
const router = (0, express_1.Router)();
// Create Razorpay order for a booking
router.post('/orders', auth_js_1.requireAuth, payment_controller_js_1.PaymentController.createOrder);
// Verify payment after successful payment
router.post('/verify', auth_js_1.requireAuth, payment_controller_js_1.PaymentController.verifyPayment);
// Get payment status for a booking
router.get('/booking/:bookingId/status', auth_js_1.requireAuth, payment_controller_js_1.PaymentController.getPaymentStatus);
// Public config for frontend (exposes only public key id)
router.get('/config', payment_controller_js_1.PaymentController.getConfig);
// Initiate refund for a payment
router.post('/refund', auth_js_1.requireAuth, payment_controller_js_1.PaymentController.initiateRefund);
// Webhook endpoint for Razorpay events (no auth required)
router.post('/webhook', payment_controller_js_1.PaymentController.handleWebhook);
exports.default = router;
