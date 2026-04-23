import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, Calendar, Star, Users, Car, Wifi, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BrandNav from '@/components/BrandNav';
import BookingSuccess from '@/components/BookingSuccess';
import SEO from '@/components/SEO';

const API_BASE_URL = 'http://localhost:4000';

interface BookingDetails {
  id: string;
  facilityId: string;
  facilityName: string;
  courtId: string;
  courtName: string;
  location: string;
  sport: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  duration: number;
  facilityImage?: string;
  amenities?: string[];
  rating?: number;
}

const BookingPageNew: React.FC = () => {
  const { venueId, courtId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    receiptId: string;
    bookingId: string;
  } | null>(null);

  // Robust date parsing for "YYYY-MM-DD" and "DD-MM-YYYY" and generic Date strings
  const parseDateFromParam = (ds: string): Date | null => {
    if (!ds) return null;
    // ISO date (YYYY-MM-DD)
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (iso.test(ds)) {
      const [y, m, d] = ds.split('-').map(Number);
      return new Date(y, (m as number) - 1, d);
    }
    // Common DD-MM-YYYY
    const dmy = /^\d{2}-\d{2}-\d{4}$/;
    if (dmy.test(ds)) {
      const [d, m, y] = ds.split('-').map(Number);
      return new Date(y, (m as number) - 1, d);
    }
    const dt = new Date(ds);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  // Get URL parameters
  const slot = searchParams.get('slot');
  const date = searchParams.get('date');
  const sport = searchParams.get('sport');

  useEffect(() => {
    console.log('=== BOOKING PAGE DEBUG ===');
    console.log('venueId:', venueId);
    console.log('courtId:', courtId);
    console.log('slot:', slot);
    console.log('date:', date);
    console.log('sport:', sport);
    console.log('isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to continue with your booking.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

  if (!venueId || !courtId || !slot || !date || !sport) {
      console.log('Missing parameters check:');
      console.log('- venueId missing:', !venueId);
      console.log('- courtId missing:', !courtId);
      console.log('- slot missing:', !slot);
      console.log('- date missing:', !date);
      console.log('- sport missing:', !sport);
      
      toast({
        title: "Invalid Booking",
        description: "Missing booking parameters. Please start over.",
        variant: "destructive",
      });
      if (venueId) {
        navigate(`/venue-details/${venueId}`);
      } else {
        navigate('/play');
      }
      return;
    }

    fetchBookingDetails();
  }, [venueId, courtId, slot, date, sport, isAuthenticated]);

  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);
      // Parse and normalize date first
      const parsed = parseDateFromParam(date || '');
      if (!parsed) {
        throw new Error('Invalid date');
      }
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      const normalizedDate = `${y}-${m}-${d}`; // store as YYYY-MM-DD

      let facility: any;
      let court: any;
      const isPlaceholder = venueId?.startsWith('placeholder-');
      if (isPlaceholder) {
        facility = {
          id: venueId,
          name: venueId === 'placeholder-1' ? 'Sample Sports Arena' : 'Community Courts',
          location: 'Demo City',
          images: ['/placeholder.svg'],
          amenities: ['Parking', 'WiFi'],
          courts: [{ id: courtId, name: 'Court 1', pricePerHour: 500 }]
        };
        court = { id: courtId, name: 'Court 1', pricePerHour: 500 };
      } else {
        // Fetch venue/facility details
        const facilityResponse = await fetch(`${API_BASE_URL}/facilities/${venueId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (!facilityResponse.ok) {
          throw new Error('Failed to fetch facility details');
        }
        facility = await facilityResponse.json();
        // Fetch court details
        const courtResponse = await fetch(`${API_BASE_URL}/courts/${courtId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (!courtResponse.ok) {
          throw new Error('Failed to fetch court details');
        }
        court = await courtResponse.json();
      }

      // Determine start/end/price based on selected slot id by querying availability for the date
      let startTimeNorm = '09:00';
      let endTimeNorm = '10:00';
      let duration = 1;
      let price = Number(court.pricePerHour);

      if (!isPlaceholder) {
        try {
          const availRes = await fetch(`${API_BASE_URL}/facilities/${venueId}/availability?date=${encodeURIComponent(normalizedDate)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
          });
          if (availRes.ok) {
            const slots = await availRes.json();
            const selected = Array.isArray(slots) ? slots.find((s: any) => s.id === slot) : null;
            if (selected) {
              startTimeNorm = selected.startTime;
              endTimeNorm = selected.endTime;
              duration = Math.max(0.5, (
                Number(selected.endTime.split(':')[0]) * 60 + Number(selected.endTime.split(':')[1] || 0) -
                (Number(selected.startTime.split(':')[0]) * 60 + Number(selected.startTime.split(':')[1] || 0))
              ) / 60);
              price = Number(selected.price) * duration / 1; // price is per-hour from API
            }
          }
        } catch (e) {
          console.warn('Availability lookup failed, using defaults/fallback:', e);
        }
      }

      const bookingData: BookingDetails = {
        id: '', // Will be set after booking creation
        facilityId: facility.id,
        facilityName: facility.name,
        courtId: court.id,
        courtName: court.name,
        location: facility.location,
        sport: sport || 'Unknown',
  date: normalizedDate,
  startTime: startTimeNorm,
  endTime: endTimeNorm,
  price,
  duration,
        facilityImage: facility.images?.[0] || '/placeholder.svg',
        amenities: facility.amenities || [],
        rating: 4.5, // Mock rating, replace with actual data
      };

      setBookingDetails(bookingData);
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
      toast({
        title: "Error",
        description: "Failed to load booking details. Please try again.",
        variant: "destructive",
      });
      navigate('/venues');
    } finally {
      setIsLoading(false);
    }
  };

  const createBooking = async () => {
    if (!bookingDetails) return;

    // Demo / placeholder guard
    if (
      bookingDetails.facilityId.startsWith('placeholder-') ||
      bookingDetails.courtId.startsWith('placeholder-')
    ) {
      toast({
        title: 'Demo Venue',
        description: 'This is a demo facility. Booking is disabled.',
      });
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      toast({
        title: "Login Required",
        description: "Please log in to make a booking.",
        variant: "destructive",
      });
      // Redirect to login with return URL
      navigate('/login', { 
        state: { from: location.pathname + location.search } 
      });
      return;
    }

    try {
      setIsCreatingBooking(true);

      // Create booking date-time strings
      const bookingDate = parseDateFromParam(bookingDetails.date);
      if (!bookingDate) {
        throw new Error('Invalid date format. Please go back and reselect your date.');
      }
  const [startHourStr, startMinStr] = bookingDetails.startTime.split(':');
  const [endHourStr, endMinStr] = bookingDetails.endTime.split(':');
  const startHour = Number(startHourStr);
  const startMin = startMinStr !== undefined ? Number(startMinStr) : 0;
  const endHour = Number(endHourStr);
  const endMin = endMinStr !== undefined ? Number(endMinStr) : 0;

      const startDateTime = new Date(bookingDate);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(bookingDate);
      endDateTime.setHours(endHour, endMin, 0, 0);

      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          courtId: bookingDetails.courtId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

  const data = await response.json();

      if (!response.ok) {
        let msg = data.message || 'Failed to create booking';
        if (msg === 'Slot unavailable') msg = 'Selected time slot is no longer available. Please pick another slot.';
        if (msg === 'Court not found') msg = 'Selected court could not be found. It might have been removed.';
        throw new Error(msg);
      }

  // Update booking details with the created booking ID (server returns the booking object directly)
  const createdBookingId = data.id;
  setBookingDetails(prev => prev ? { ...prev, id: createdBookingId } : null);

  // Generate a simple receipt id and show success modal directly (no payment gateway)
  const receiptId = `RCPT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  handleReceiptGenerated(receiptId, createdBookingId);
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleReceiptGenerated = (receiptId: string, bookingId: string) => {
    setReceiptData({ receiptId, bookingId });
    setShowSuccessModal(true);
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BrandNav />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
            <p>Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BrandNav />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <p>Booking details not found.</p>
            <Button onClick={() => navigate('/venues')} className="mt-4">
              Back to Venues
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title={`Book ${bookingDetails.facilityName} - QuickCourt`}
        description={`Complete your booking for ${bookingDetails.courtName} at ${bookingDetails.facilityName}`}
      />
      
      <BrandNav />
      
      <div className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Complete Booking</h1>
              <p className="text-gray-600">Review details and confirm your reservation</p>
            </div>
          </div>

          {/* Booking Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    <img 
                      src={bookingDetails.facilityImage} 
                      alt={bookingDetails.facilityName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{bookingDetails.facilityName}</CardTitle>
                        <p className="text-sm text-gray-600">{bookingDetails.courtName}</p>
                        {bookingDetails.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{bookingDetails.rating}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {bookingDetails.sport}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{bookingDetails.location}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(bookingDetails.date)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {formatTime(bookingDetails.startTime)} - {formatTime(bookingDetails.endTime)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({bookingDetails.duration} hour{bookingDetails.duration > 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                {bookingDetails.amenities && bookingDetails.amenities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {bookingDetails.amenities.slice(0, 6).map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <h4 className="font-medium">Price Breakdown</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Court rental rate</span>
                      <span>₹{(bookingDetails.price / bookingDetails.duration).toFixed(0)}/hour</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration</span>
                      <span>{bookingDetails.duration} hour{bookingDetails.duration > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-1 border-t">
                      <span>Total Amount</span>
                      <span className="text-green-600">₹{bookingDetails.price}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              onClick={createBooking}
              disabled={isCreatingBooking}
              className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isCreatingBooking ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Booking...
                </>
              ) : !isAuthenticated ? (
                <>
                  Login to Book - ₹{bookingDetails.price}
                </>
              ) : (
                <>
                  Confirm Booking & Generate Receipt - ₹{bookingDetails.price}
                </>
              )}
            </Button>
          </motion.div>

          {/* Terms */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 text-center text-xs text-gray-500"
          >
            <p>
              By proceeding, you agree to our Terms of Service and Privacy Policy.
              Cancellations are subject to the facility's cancellation policy.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Success Modal */}
  {showSuccessModal && receiptData && bookingDetails && (
        <BookingSuccess
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/my-bookings');
          }}
          bookingData={{
            ...bookingDetails,
    receiptId: receiptData.receiptId,
          }}
        />
      )}
    </div>
  );
};

export default BookingPageNew;
