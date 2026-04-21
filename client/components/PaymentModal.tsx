import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Card, CardContent } from './ui/card';
import { Clock, MapPin, Calendar, CreditCard, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRazorpayPayment, PaymentOptions } from '../hooks/useRazorpayPayment';
import { useToast } from '../hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string, bookingId: string) => void;
  bookingData: {
    id: string;
    facilityName: string;
    courtName: string;
    location: string;
    sport: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    duration: number; // in hours
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bookingData,
}) => {
  const { processPayment, isLoading, error, setError } = useRazorpayPayment();
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handlePayment = async () => {
    setError(null);

    const paymentOptions: PaymentOptions = {
      bookingId: bookingData.id,
      amount: bookingData.price,
      facilityName: bookingData.facilityName,
      courtName: bookingData.courtName,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
    };

    try {
      const result = await processPayment(paymentOptions);

      if (result.success && result.paymentId && result.bookingId) {
        toast({
          title: "Payment Successful!",
          description: "Your booking has been confirmed successfully.",
          variant: "default",
        });
        onSuccess(result.paymentId, result.bookingId);
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Something went wrong during payment.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Failed to process payment.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5 text-green-600" />
            Complete Payment
          </DialogTitle>
          <DialogDescription>
            Review your booking details and complete payment to confirm your reservation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Summary Card */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">{bookingData.facilityName}</h3>
                  <p className="text-sm text-green-700">{bookingData.courtName}</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {bookingData.sport}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-green-700">
                  <MapPin className="h-4 w-4" />
                  <span>{bookingData.location}</span>
                </div>

                <div className="flex items-center gap-2 text-green-700">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(bookingData.date)}</span>
                </div>

                <div className="flex items-center gap-2 text-green-700">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
                  </span>
                  <span className="text-xs">({bookingData.duration}h)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-medium">Price Breakdown</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Court rental ({bookingData.duration}h)</span>
                  <span>₹{(bookingData.price / bookingData.duration).toFixed(0)}/hour</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span>{bookingData.duration} hour{bookingData.duration > 1 ? 's' : ''}</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-base">
                  <span>Total Amount</span>
                  <span className="text-green-600">₹{bookingData.price}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </motion.div>
          )}

          {/* Security Features */}
          <div className="flex items-center justify-center gap-4 py-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-green-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Instant Confirmation</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ₹{bookingData.price}
                </>
              )}
            </Button>
          </div>

          {/* Payment Methods Info */}
          <div className="text-center text-xs text-gray-500 pt-2">
            <p>Powered by Razorpay • UPI, Cards, Wallets & More</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
