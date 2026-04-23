"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
class RazorpayService {
    static rupeesToPaise(amount) {
        return Math.round(amount * 100);
    }
    static paiseToRupees(amount) {
        return amount / 100;
    }
    static generateReceiptId(prefix) {
        const rand = Math.random().toString(36).slice(2, 8);
        const ts = Date.now().toString(36);
        return `${prefix}_${ts}_${rand}`;
    }
    static async createOrder(args) {
        var _a, _b;
        // Placeholder implementation; integrate real SDK when keys are configured
        return Promise.resolve({
            id: this.generateReceiptId('order'),
            amount: args.amount,
            currency: (_a = args.currency) !== null && _a !== void 0 ? _a : 'INR',
            receipt: args.receipt,
            notes: (_b = args.notes) !== null && _b !== void 0 ? _b : {},
            status: 'created',
        });
    }
    static verifyPaymentSignature(_data) {
        // Without real secret, just accept for development; replace with HMAC check
        return true;
    }
    static async getPayment(_paymentId) {
        // Pretend the payment is captured in dev
        return Promise.resolve({ status: 'captured' });
    }
    static async initiateRefund(_paymentId, amount, _notes) {
        return Promise.resolve({ id: this.generateReceiptId('refund'), amount: amount !== null && amount !== void 0 ? amount : 0, status: 'processed' });
    }
    static verifyWebhookSignature(_body, _signature) {
        return true;
    }
}
exports.RazorpayService = RazorpayService;
