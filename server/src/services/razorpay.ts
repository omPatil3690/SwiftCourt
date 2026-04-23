export type PaymentVerificationData = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bookingId?: string;
};

type CreateOrderArgs = {
  amount: number; // in paise
  receipt: string;
  currency?: string;
  notes?: Record<string, string>;
};

export class RazorpayService {
  static rupeesToPaise(amount: number) {
    return Math.round(amount * 100);
  }

  static paiseToRupees(amount: number) {
    return amount / 100;
  }

  static generateReceiptId(prefix: string) {
    const rand = Math.random().toString(36).slice(2, 8);
    const ts = Date.now().toString(36);
    return `${prefix}_${ts}_${rand}`;
  }

  static async createOrder(args: CreateOrderArgs) {
    // Placeholder implementation; integrate real SDK when keys are configured
    return Promise.resolve({
      id: this.generateReceiptId('order'),
      amount: args.amount,
      currency: args.currency ?? 'INR',
      receipt: args.receipt,
      notes: args.notes ?? {},
      status: 'created',
    });
  }

  static verifyPaymentSignature(_data: PaymentVerificationData) {
    // Without real secret, just accept for development; replace with HMAC check
    return true;
  }

  static async getPayment(_paymentId: string) {
    // Pretend the payment is captured in dev
    return Promise.resolve({ status: 'captured' as const });
  }

  static async initiateRefund(_paymentId: string, amount?: number, _notes?: Record<string, string>) {
    return Promise.resolve({ id: this.generateReceiptId('refund'), amount: amount ?? 0, status: 'processed' });
  }

  static verifyWebhookSignature(_body: string, _signature: string) {
    return true;
  }
}
