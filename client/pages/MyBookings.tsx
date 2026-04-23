import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Calendar, Clock, MapPin, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi, Booking } from '../lib/api';
import BrandNav from '../components/BrandNav';
import SEO from '../components/SEO';
import { useToast } from '../hooks/use-toast';

const MyBookings = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingsApi.getMy,
    enabled: isAuthenticated,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      case 'COMPLETED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const canCancel = (booking: Booking) => {
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    return booking.status === 'CONFIRMED' && minutesDiff > 30;
  };

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      // TODO: Implement cancel booking API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Booking cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
      
      refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel booking. Please try again.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const filterBookings = (bookings: Booking[], filter: string) => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return bookings.filter(b => new Date(b.startTime) > now && b.status !== 'CANCELLED');
      case 'past':
        return bookings.filter(b => new Date(b.startTime) <= now || b.status === 'COMPLETED');
      case 'cancelled':
        return bookings.filter(b => b.status === 'CANCELLED');
      default:
        return bookings;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{booking.court.facility.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {booking.court.name}
            </p>
          </div>
          <Badge variant={getStatusColor(booking.status) as any}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            {formatDate(booking.startTime)}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-2 h-4 w-4" />
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            {booking.court.facility.location}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="font-semibold">
              ${Number(booking.price).toFixed(2)}
            </span>
            
            {canCancel(booking) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={cancellingId === booking.id}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this booking? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, keep booking</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleCancel(booking.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, cancel booking
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <BrandNav />
        <main className="container mx-auto px-4 pt-24 pb-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p>Please sign in to view your bookings.</p>
              <Button className="mt-4" onClick={() => window.location.href = '/login'}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="My Bookings - QuickCourt" description="View and manage your court bookings" path="/my-bookings" />
      <BrandNav />
      
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">
            View and manage your court reservations
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          
          {['all', 'upcoming', 'past', 'cancelled'].map((filter) => (
            <TabsContent key={filter} value={filter} className="mt-6">
              {isLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filterBookings(bookings || [], filter).length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">
                          {filter === 'all' ? 'No bookings found.' :
                           filter === 'upcoming' ? 'No upcoming bookings.' :
                           filter === 'past' ? 'No past bookings.' :
                           'No cancelled bookings.'}
                        </p>
                        {filter === 'all' && (
                          <Button className="mt-4" onClick={() => window.location.href = '/venues'}>
                            Book a Court
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    filterBookings(bookings || [], filter).map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default MyBookings;
