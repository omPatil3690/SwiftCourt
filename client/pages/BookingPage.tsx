import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import BrandNav from '../components/BrandNav';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, Clock, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { bookingsApi, courtsApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';

const BookingPage = () => {
  const { venueId, courtId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const params = new URLSearchParams(useLocation().search);
  const slotId = params.get('slot') || '';
  const date = params.get('date') || new Date().toISOString().split('T')[0];

  const [court, setCourt] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timeFromSlot = useMemo(() => {
    if (!slotId) return null;
    // slot id format: `${court.id}-${date}-${startMin}` but both id and date contain hyphens.
    // So we always parse the last segment as startMin.
    const lastDash = slotId.lastIndexOf('-');
    const startMinStr = slotId.slice(lastDash + 1);
    const startMin = Number(startMinStr);
    if (Number.isNaN(startMin)) return null;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setMinutes(startMin);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return { start, end };
  }, [slotId, date]);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await courtsApi.getById(courtId!);
        setCourt(c);
      } catch (e) {
        setError('Failed to load court');
      }
    };
    if (courtId) load();
  }, [courtId]);

  const handleConfirm = async () => {
    if (!courtId || !timeFromSlot) return;
    setCreating(true);
    setError(null);
    try {
      const created = await bookingsApi.create({
        courtId,
        startTime: timeFromSlot.start.toISOString(),
        endTime: timeFromSlot.end.toISOString(),
      });
      setBooking(created);
      toast({ title: 'Booking Confirmed', description: 'Your slot has been booked.' });
    } catch (e: any) {
      setError(e?.message || 'Failed to create booking');
      toast({ title: 'Booking failed', description: e?.message || 'Slot unavailable', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleGoToProfile = () => navigate('/profile');

  if (!timeFromSlot) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Book Court - QuickCourt" description="Complete your court booking" />
        <BrandNav />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle>Select a slot first</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Please go back and pick a time slot.</p>
              <Button className="mt-4" onClick={() => navigate(`/venue-details/${venueId}`)}>Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Confirm Booking - QuickCourt" description="Review and confirm your court booking" />
      <BrandNav />

      <div className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 text-red-700 bg-red-50 border border-red-200 rounded">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{timeFromSlot.start.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {timeFromSlot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {timeFromSlot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {court && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{court.facility.name} • {court.name} • {court.facility.location}</span>
                </div>
              )}
              {court && (
                <div className="pt-2">
                  <Badge>₹{Number(court.pricePerHour)}/hr</Badge>
                </div>
              )}
            </div>

            {!booking ? (
              <div className="mt-6 flex gap-3">
                <Button onClick={handleConfirm} disabled={creating} className="bg-green-600 hover:bg-green-700">
                  {creating ? 'Booking...' : 'Confirm Booking'}
                </Button>
                <Button variant="outline" onClick={() => navigate(`/venue-details/${venueId}`)}>Change Slot</Button>
              </div>
            ) : (
              <div className="mt-6 p-4 border rounded bg-green-50 text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Booking confirmed. View it in your profile.
              </div>
            )}

            {booking && (
              <div className="mt-6">
                <Button onClick={handleGoToProfile}>Go to My Profile</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Deprecated booking page variant. Use BookingPageNew.tsx.
export default function DeprecatedBookingPage() { return null; }
