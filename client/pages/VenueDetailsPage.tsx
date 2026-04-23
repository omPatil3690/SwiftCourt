import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, ArrowLeft, Share2, Heart, Clock, Users, Car, Camera, Shield, Wifi, Coffee, AirVent, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import BrandNav from '../components/BrandNav';
import BookingWidget from '../components/BookingWidget';
import ImageCarousel from '../components/ImageCarousel';
import ReviewCard from '../components/ReviewCard';
import SEO from '../components/SEO';
import { facilitiesApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { io as ioClient } from 'socket.io-client';
import { API_BASE_URL } from '../lib/api';

export interface VenueDetails {
  id: string;
  name: string;
  location: string;
  address: string;
  rating: number;
  reviewCount: number;
  images: string[];
  videos?: string[];
  sports: {
    id: string;
    name: string;
    icon: string;
    isActive: boolean;
  }[];
  amenities: {
    id: string;
    name: string;
    icon: string;
    category: string;
  }[];
  description: string;
  priceRange: {
    min: number;
    max: number;
  };
  operatingHours: {
    open: string;
    close: string;
  };
  isVerified: boolean;
  ownerId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  sport: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
  courtId: string;
  courtName: string;
}

const VenueDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // State
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isLoadingVenue, setIsLoadingVenue] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSport, setReviewSport] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Mock data for development
  const mockVenue: VenueDetails = {
    id: id || '1',
    name: 'SBR Badminton',
    location: 'Satellite, Jodhpur Village',
    address: '123 Sports Complex, Satellite Road, Jodhpur Village, Ahmedabad, Gujarat 380015',
    rating: 4.9,
    reviewCount: 0, // No fake review count - only real reviews
    images: [
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg'
    ],
    videos: ['/placeholder.mp4'],
    sports: [
      { id: '1', name: 'Badminton', icon: '🏸', isActive: true },
      { id: '2', name: 'Cricket', icon: '🏏', isActive: true },
      { id: '3', name: 'Tennis', icon: '🎾', isActive: false }
    ],
    amenities: [
      { id: '1', name: 'Parking', icon: 'Car', category: 'convenience' },
      { id: '2', name: 'Restrooms', icon: 'Users', category: 'convenience' },
      { id: '3', name: 'CCTV', icon: 'Shield', category: 'security' },
      { id: '4', name: 'WiFi', icon: 'Wifi', category: 'connectivity' },
      { id: '5', name: 'Cafeteria', icon: 'Coffee', category: 'food' },
      { id: '6', name: 'AC/Ventilation', icon: 'AirVent', category: 'comfort' }
    ],
    description: 'SBR Badminton is a premier sports facility offering world-class badminton courts with professional-grade flooring and lighting. Our venue provides an exceptional playing experience for players of all skill levels, from beginners to tournament-level athletes.',
    priceRange: { min: 400, max: 800 },
    operatingHours: { open: '05:00', close: '23:00' },
    isVerified: true,
    ownerId: 'owner1',
    createdAt: '2023-01-15T10:00:00Z'
  };

  const mockReviews: Review[] = [];

  const mockTimeSlots: TimeSlot[] = [
    { id: '1', startTime: '05:00', endTime: '06:00', price: 400, isAvailable: true, courtId: 'court1', courtName: 'Court 1' },
    { id: '2', startTime: '06:00', endTime: '07:00', price: 500, isAvailable: true, courtId: 'court1', courtName: 'Court 1' },
    { id: '3', startTime: '07:00', endTime: '08:00', price: 600, isAvailable: false, courtId: 'court1', courtName: 'Court 1' },
    { id: '4', startTime: '08:00', endTime: '09:00', price: 700, isAvailable: true, courtId: 'court2', courtName: 'Court 2' },
    { id: '5', startTime: '09:00', endTime: '10:00', price: 800, isAvailable: true, courtId: 'court2', courtName: 'Court 2' },
    { id: '6', startTime: '18:00', endTime: '19:00', price: 700, isAvailable: true, courtId: 'court1', courtName: 'Court 1' },
    { id: '7', startTime: '19:00', endTime: '20:00', price: 800, isAvailable: true, courtId: 'court1', courtName: 'Court 1' },
    { id: '8', startTime: '20:00', endTime: '21:00', price: 750, isAvailable: false, courtId: 'court2', courtName: 'Court 2' }
  ];

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  // Effects
  useEffect(() => {
    fetchVenueDetails();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (selectedSport && selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedSport, selectedDate]);

  // Refetch availability on booking events for this venue/date
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const socket = ioClient(API_BASE_URL, { auth: { token } });

    const shouldRefetch = (payload: any) => {
      if (!id) return false;
      const payloadDate = new Date(payload.startTime).toISOString().split('T')[0];
      return payload.facilityId === id && payloadDate === selectedDate;
    };

    socket.on('booking:confirmed', (payload: any) => {
      if (shouldRefetch(payload)) fetchTimeSlots();
    });
    socket.on('booking:cancelled', (payload: any) => {
      if (shouldRefetch(payload)) fetchTimeSlots();
    });

    return () => {
      socket.disconnect();
    };
  }, [id, selectedDate]);

  useEffect(() => {
    if (venue?.sports.length > 0) {
      const firstActiveSport = venue.sports.find(sport => sport.isActive);
      if (firstActiveSport) {
        setSelectedSport(firstActiveSport.id);
      }
    }
  }, [venue]);

  // API Functions
  const fetchVenueDetails = async () => {
    try {
      setIsLoadingVenue(true);
      if (!id) {
        throw new Error('Venue ID is required');
      }
      // Short‑circuit for placeholder/demo IDs to avoid unnecessary 404s
      if (id.startsWith('placeholder-')) {
        const demo = { ...mockVenue, id, name: id === 'placeholder-1' ? 'Sample Sports Arena' : 'Community Courts' };
        setVenue(demo);
        setIsLoadingVenue(false);
        return;
      }
      // Get real venue data from API
      const facility = await facilitiesApi.getById(id);
      
      // Convert Facility to VenueDetails format
      const venueDetails: VenueDetails = {
        id: facility.id,
        name: facility.name,
        location: facility.location,
        address: `${facility.location}, India`,
        rating: 0, // Only real user ratings
        reviewCount: 0, // Only real review count
        images: facility.images.length > 0 ? facility.images : ['/placeholder.svg'],
        videos: [],
        sports: facility.sports.map((sport, index) => ({
          id: (index + 1).toString(),
          name: sport,
          icon: sport === 'Badminton' ? '🏸' : sport === 'Tennis' ? '🎾' : sport === 'Cricket' ? '🏏' : '⚽',
          isActive: true
        })),
        amenities: (facility.amenities || []).map((amenity, index) => ({
          id: (index + 1).toString(),
          name: amenity,
          icon: 'Star',
          category: 'general'
        })),
        description: facility.description || `${facility.name} is a premium sports facility offering excellent courts and amenities for sports enthusiasts.`,
        priceRange: {
          min: facility.courts.length > 0 ? Math.min(...facility.courts.map(c => c.pricePerHour)) : 400,
          max: facility.courts.length > 0 ? Math.max(...facility.courts.map(c => c.pricePerHour)) : 800
        },
        operatingHours: { open: '06:00', close: '22:00' },
        isVerified: facility.status === 'APPROVED',
        ownerId: facility.ownerId || 'unknown',
        createdAt: facility.createdAt || new Date().toISOString()
      };
      
      setVenue(venueDetails);
      setIsLoadingVenue(false);
    } catch (error: any) {
      // Gracefully fall back for placeholder IDs
      if (id && id.startsWith('placeholder-')) {
        const demo = { ...mockVenue, id, name: id === 'placeholder-1' ? 'Sample Sports Arena' : 'Community Courts' };
        setVenue(demo);
        setIsLoadingVenue(false);
        return;
      }
      console.error('Error fetching venue details:', error);
      if (error?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load venue details. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: 'Venue Not Found',
          description: 'This venue may have been removed.',
          variant: 'destructive'
        });
      }
      setIsLoadingVenue(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      setIsLoadingSlots(true);
      if (id && id.startsWith('placeholder-')) {
        setTimeSlots(mockTimeSlots);
        setIsLoadingSlots(false);
        return;
      }
      // Use real API to get hourly slots for selected date
      const slots = await facilitiesApi.getAvailability(id!, selectedDate);
      setTimeSlots(slots);
      setIsLoadingSlots(false);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available time slots. Please try again.',
        variant: 'destructive'
      });
      setIsLoadingSlots(false);
    }
  };

  const fetchReviews = async (page: number = 1) => {
    try {
      setIsLoadingReviews(true);
      // TODO: Replace with actual API call
      // const response = await facilitiesApi.getVenueReviews(id, page, 10);
      // if (page === 1) {
      //   setReviews(response.data.reviews);
      // } else {
      //   setReviews(prev => [...prev, ...response.data.reviews]);
      // }
      // setHasMoreReviews(response.data.hasMore);
      
      // Using mock data for now
      setTimeout(() => {
        if (page === 1) {
          setReviews(mockReviews);
        } else {
          // Simulate no more reviews for demo
          setHasMoreReviews(false);
        }
        setIsLoadingReviews(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again.",
        variant: "destructive"
      });
      setIsLoadingReviews(false);
    }
  };

  // Handlers
  const handleSportSelect = (sportId: string) => {
    setSelectedSport(sportId);
    setSelectedSlot(''); // Reset selected slot when sport changes
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(''); // Reset selected slot when date changes
  };

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlot(slotId);
  };

  const handleLoadMoreReviews = () => {
    const nextPage = reviewsPage + 1;
    setReviewsPage(nextPage);
    fetchReviews(nextPage);
  };

  const handleBookNow = () => {
    if (!selectedSlot) {
      toast({
        title: "No Slot Selected",
        description: "Please select a time slot to proceed with booking.",
        variant: "destructive"
      });
      return;
    }

    const slot = timeSlots.find(s => s.id === selectedSlot);
    if (slot) {
      navigate(`/book/${venue?.id}/${slot.courtId}?slot=${selectedSlot}&date=${selectedDate}&sport=${selectedSport}`);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: venue?.name || 'Sports Venue',
          text: `Check out ${venue?.name} - ${venue?.location}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Venue link has been copied to clipboard.",
      });
    }
  };

  const isDemoVenue = venue && venue.id.startsWith('placeholder-');

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removed from Favorites" : "Added to Favorites",
      description: isFavorite 
        ? "Venue removed from your favorites." 
        : "Venue added to your favorites.",
    });
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Please Login",
        description: "You need to login to submit a review.",
        variant: "destructive"
      });
      return;
    }

    if (!reviewComment.trim()) {
      toast({
        title: "Review Required",
        description: "Please write a review comment.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmittingReview(true);

      // In a real app, this would be an API call
      const newReview: Review = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.fullName,
        userAvatar: user.avatarUrl || '/placeholder.svg',
        rating: reviewRating,
        comment: reviewComment.trim(),
        date: new Date().toISOString(),
        sport: reviewSport || venue?.sports[0]?.name || ''
      };

      // Add to reviews state
      setReviews(prev => [newReview, ...prev]);
      
      // Update venue review count
      if (venue) {
        setVenue(prev => prev ? {
          ...prev,
          reviewCount: prev.reviewCount + 1,
          rating: prev.reviewCount > 0 
            ? ((prev.rating * prev.reviewCount) + reviewRating) / (prev.reviewCount + 1)
            : reviewRating
        } : null);
      }

      // Reset form
      setReviewComment('');
      setReviewRating(5);
      setReviewSport('');
      setShowReviewForm(false);

      toast({
        title: "Review Submitted",
        description: "Thank you for your review! It helps other players.",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Render helper for Demo badge
  const DemoBadge = () => (
    <span className="inline-flex items-center rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-medium border border-amber-200 ml-2">
      Demo
    </span>
  );

  const getAmenityIcon = (iconName: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Car: <Car className="h-5 w-5" />,
      Users: <Users className="h-5 w-5" />,
      Shield: <Shield className="h-5 w-5" />,
      Wifi: <Wifi className="h-5 w-5" />,
      Coffee: <Coffee className="h-5 w-5" />,
      AirVent: <AirVent className="h-5 w-5" />
    };
    return icons[iconName] || <Clock className="h-5 w-5" />;
  };

  if (isLoadingVenue) {
    return (
      <div className="min-h-screen bg-green-50">
        <BrandNav />
        <div className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column Skeleton */}
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-64 w-full rounded-xl" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </div>
                <Skeleton className="h-32 w-full" />
              </div>
              {/* Right Column Skeleton */}
              <div className="lg:col-span-1">
                <Skeleton className="h-96 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-green-50">
        <BrandNav />
        <div className="pt-24 pb-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
            <Button onClick={() => navigate('/book')}>
              Browse Other Venues
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      <SEO
        title={`${venue.name} - Book Sports Courts | QuickCourt`}
        description={`Book courts at ${venue.name} in ${venue.location}. ${venue.description.substring(0, 150)}...`}
        keywords={`${venue.name}, sports booking, ${venue.sports.map(s => s.name).join(', ')}, ${venue.location}`}
      />
      
      <BrandNav />
      
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-green-600 hover:text-green-700 hover:bg-green-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Venues
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <motion.div
              className="lg:col-span-2 space-y-8"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Venue Header */}
              <motion.div variants={staggerItem}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      {venue.name}
                      {venue.isVerified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      )}
                    </h1>
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{venue.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-medium text-sm">
                          {venue.reviewCount > 0 ? venue.rating : 'New'}
                        </span>
                        {venue.reviewCount > 0 && (
                          <span className="text-sm">({venue.reviewCount} reviews)</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{venue.address}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="h-9 w-9 p-0"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFavorite}
                      className={`h-9 w-9 p-0 ${isFavorite ? 'text-red-500 border-red-200' : ''}`}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Image/Video Gallery */}
              <motion.div variants={staggerItem}>
                <ImageCarousel 
                  images={venue.images} 
                  videos={venue.videos}
                  venueName={venue.name}
                />
              </motion.div>

              {/* Mobile Booking Widget */}
              <motion.div 
                variants={staggerItem}
                className="lg:hidden"
              >
                <BookingWidget
                  venue={venue}
                  timeSlots={timeSlots}
                  selectedSport={selectedSport}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  isLoadingSlots={isLoadingSlots}
                  onSportSelect={handleSportSelect}
                  onDateSelect={handleDateSelect}
                  onSlotSelect={handleSlotSelect}
                  onBookNow={handleBookNow}
                />
              </motion.div>

              {/* Sports Available */}
              <motion.div variants={staggerItem}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Sports Available</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {venue.sports.map((sport) => (
                    <motion.div
                      key={sport.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSportSelect(sport.id)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                        selectedSport === sport.id
                          ? 'border-green-500 bg-green-50'
                          : sport.isActive
                            ? 'border-gray-200 hover:border-green-300'
                            : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">{sport.icon}</div>
                        <h3 className="font-medium text-sm text-gray-900">{sport.name}</h3>
                        {!sport.isActive && (
                          <span className="text-xs text-gray-500">Coming Soon</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Amenities */}
              <motion.div variants={staggerItem}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {venue.amenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="text-green-600">
                        {getAmenityIcon(amenity.icon)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* About Venue */}
              <motion.div variants={staggerItem}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About Venue</h2>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed">{venue.description}</p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Open {venue.operatingHours.open} - {venue.operatingHours.close}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>₹{venue.priceRange.min} - ₹{venue.priceRange.max} per hour</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Player Reviews & Ratings */}
              <motion.div variants={staggerItem}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Player Reviews {venue.reviewCount > 0 ? `(${venue.reviewCount})` : ''}
                  </h2>
                  {user && (
                    <Button 
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      variant={showReviewForm ? "outline" : "default"}
                      size="sm"
                    >
                      {showReviewForm ? 'Cancel' : 'Write Review'}
                    </Button>
                  )}
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Share Your Experience</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Rating Selection */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Rating
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setReviewRating(rating)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star 
                                className={`h-6 w-6 ${
                                  rating <= reviewRating 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {reviewRating} star{reviewRating !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Sport Selection */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Sport (optional)
                        </label>
                        <Select value={reviewSport} onValueChange={setReviewSport}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sport you played" />
                          </SelectTrigger>
                          <SelectContent>
                            {venue.sports.map((sport) => (
                              <SelectItem key={sport.id} value={sport.name}>
                                {sport.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Review Comment */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Your Review
                        </label>
                        <Textarea
                          placeholder="Share your experience at this venue. What did you like? Any tips for other players?"
                          value={reviewComment}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 500) {
                              setReviewComment(value);
                            }
                          }}
                          rows={4}
                          className="resize-none"
                        />
                        <p className={`text-xs mt-1 ${
                          reviewComment.length > 450 ? 'text-red-500' : 'text-gray-500'
                        }`}>
                          {reviewComment.length}/500 characters
                        </p>
                      </div>

                      {/* Submit Button */}
                      <div className="flex gap-3 pt-2">
                        <Button 
                          onClick={handleSubmitReview}
                          disabled={isSubmittingReview || !reviewComment.trim()}
                          className="flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowReviewForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No reviews yet. Be the first to review this venue!</p>
                      {user && !showReviewForm && (
                        <Button 
                          onClick={() => setShowReviewForm(true)}
                          className="mt-3"
                          variant="outline"
                        >
                          Write First Review
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {hasMoreReviews && reviews.length > 0 && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMoreReviews}
                        disabled={isLoadingReviews}
                        className="px-8"
                      >
                        {isLoadingReviews ? 'Loading...' : 'Load More Reviews'}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Sticky Booking Widget (Desktop) */}
            <motion.div
              className="lg:col-span-1 hidden lg:block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="sticky top-24">
                <BookingWidget
                  venue={venue}
                  timeSlots={timeSlots}
                  selectedSport={selectedSport}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  isLoadingSlots={isLoadingSlots}
                  onSportSelect={handleSportSelect}
                  onDateSelect={handleDateSelect}
                  onSlotSelect={handleSlotSelect}
                  onBookNow={handleBookNow}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetailsPage;
