import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PaymentOptions {
  bookingId: string;
  amount: number;
  facilityName: string;
  courtName: string;
  startTime: string;
  endTime: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  bookingId?: string;
  error?: string;
}

export const useRazorpayPayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createOrder = async (bookingId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      return data.data;
    } catch (err) {
      console.error('Create order error:', err);
      throw err;
    }
  };

  const verifyPayment = async (paymentData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment verification failed');
      }

      return data;
    } catch (err) {
      console.error('Verify payment error:', err);
      throw err;
    }
  };

  const initializeRazorpaySDK = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        resolve();
        return;
      }

      // Load Razorpay SDK
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.head.appendChild(script);
    });
  }, []);

  const processPayment = useCallback(async (options: PaymentOptions): Promise<PaymentResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Load Razorpay SDK
      await initializeRazorpaySDK();

      // Create order
      const orderData = await createOrder(options.bookingId);

      // Resolve Razorpay key (prefer env, fallback to backend config)
      let keyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
      if (!keyId) {
        try {
          const cfgResp = await fetch(`${API_BASE_URL}/payments/config`);
          if (cfgResp.ok) {
            const cfg = await cfgResp.json();
            keyId = cfg?.data?.keyId;
          }
        } catch (e) {
          console.warn('Failed to fetch Razorpay key from backend', e);
        }
      }
      if (!keyId) {
        throw new Error('Payment Failed because of a configuration error. Authentication key is missing. Set VITE_RAZORPAY_KEY_ID in .env or configure backend RAZORPAY_KEY_ID.');
      }

      // Configure Razorpay options
      const razorpayOptions = {
        key: keyId, // Razorpay Key ID
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'QuickCourt',
        description: `Booking for ${options.facilityName} - ${options.courtName}`,
        image: '/logo.png', // Your logo URL
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
        },
        theme: {
          color: '#16a34a', // Green theme matching your app
        },
        handler: async function (response: any) {
          try {
            // Verify payment with backend
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: options.bookingId,
            };

            await verifyPayment(verificationData);
            
            return {
              success: true,
              paymentId: response.razorpay_payment_id,
              bookingId: options.bookingId,
            };
          } catch (error) {
            console.error('Payment verification failed:', error);
            throw error;
          }
        },
        modal: {
          ondismiss: function() {
            setError('Payment was cancelled by user');
            setIsLoading(false);
          },
        },
        notes: {
          bookingId: options.bookingId,
          facilityName: options.facilityName,
          courtName: options.courtName,
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(razorpayOptions);
      
      return new Promise((resolve) => {
        razorpay.on('payment.success', async (response: any) => {
          try {
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: options.bookingId,
            };

            await verifyPayment(verificationData);
            
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              bookingId: options.bookingId,
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Payment verification failed',
            });
          } finally {
            setIsLoading(false);
          }
        });

        razorpay.on('payment.error', (response: any) => {
          setError(response.error?.description || 'Payment failed');
          setIsLoading(false);
          resolve({
            success: false,
            error: response.error?.description || 'Payment failed',
          });
        });

        razorpay.open();
      });

    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Payment processing failed');
      setIsLoading(false);
      
      return {
        success: false,
        error: err.message || 'Payment processing failed',
      };
    }
  }, [user, initializeRazorpaySDK]);

  const getPaymentStatus = async (bookingId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/booking/${bookingId}/status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch payment status');
      }

      return data.data;
    } catch (err) {
      console.error('Get payment status error:', err);
      throw err;
    }
  };

  const initiateRefund = async (paymentId: string, reason?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ paymentId, reason }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate refund');
      }

      return data;
    } catch (err) {
      console.error('Initiate refund error:', err);
      throw err;
    }
  };

  return {
    processPayment,
    getPaymentStatus,
    initiateRefund,
    isLoading,
    error,
    setError,
  };
};
