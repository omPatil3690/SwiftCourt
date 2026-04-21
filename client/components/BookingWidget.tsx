import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';

interface VenueDetails {
  id: string;
  name: string;
  location: string;
  sports: {
    id: string;
    name: string;
    icon: string;
    isActive: boolean;
  }[];
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
  courtId: string;
  courtName: string;
}

interface BookingWidgetProps {
  venue: VenueDetails;
  timeSlots: TimeSlot[];
  selectedSport: string;
  selectedDate: string;
  selectedSlot: string;
  isLoadingSlots: boolean;
  onSportSelect: (sportId: string) => void;
  onDateSelect: (date: string) => void;
  onSlotSelect: (slotId: string) => void;
  onBookNow: () => void;
}

const BookingWidget = ({
  venue,
  timeSlots,
  selectedSport,
  selectedDate,
  selectedSlot,
  isLoadingSlots,
  onSportSelect,
  onDateSelect,
  onSlotSelect,
  onBookNow
}: BookingWidgetProps) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-IN', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const selectedSlotData = timeSlots.find(slot => slot.id === selectedSlot);
  const activeSports = venue.sports.filter(sport => sport.isActive);
  const availableSlots = timeSlots.filter(slot => slot.isAvailable);

  // Generate date options (today + next 7 days)
  const dateOptions = Array.from({ length: 8 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      value: date.toISOString().split('T')[0],
      label: formatDate(date.toISOString().split('T')[0]),
      date: date
    };
  });

  return (
    <Card className="shadow-lg border-green-200">
      <CardHeader className="pb-4 bg-green-50 border-b border-green-100">
        <CardTitle className="text-xl font-bold text-green-800 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Court Booking
        </CardTitle>
        <p className="text-sm text-green-600">
          Select your preferred time and court
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Sport Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sport</label>
          <Select value={selectedSport} onValueChange={onSportSelect}>
            <SelectTrigger className="h-11 border-green-200 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Select a sport" />
            </SelectTrigger>
            <SelectContent>
              {activeSports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id}>
                  <div className="flex items-center gap-2">
                    <span>{sport.icon}</span>
                    <span>{sport.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <Select value={selectedDate} onValueChange={onDateSelect}>
            <SelectTrigger className="h-11 border-green-200 focus:border-green-500 focus:ring-green-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />
                <SelectValue placeholder="Select date" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {option.date.toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Slot Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Available Time Slots</label>
            {selectedSport && selectedDate && (
              <span className="text-xs text-gray-500">
                {availableSlots.length} slots available
              </span>
            )}
          </div>

          {!selectedSport || !selectedDate ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select sport and date to view available slots</p>
            </div>
          ) : isLoadingSlots ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No slots available for this date</p>
              <p className="text-xs mt-1">Try selecting a different date</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {timeSlots.map((slot, index) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => slot.isAvailable && onSlotSelect(slot.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedSlot === slot.id
                        ? 'border-green-500 bg-green-50'
                        : slot.isAvailable
                          ? 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            slot.isAvailable ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                          {selectedSlot === slot.id && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{slot.courtName}</span>
                          {!slot.isAvailable && (
                            <Badge variant="secondary" className="text-xs">
                              Booked
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          slot.isAvailable ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          ₹{slot.price}
                        </div>
                        <div className="text-xs text-gray-500">per hour</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Selected Slot Summary */}
        {selectedSlotData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <h4 className="font-medium text-green-900 mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Sport:</span>
                <span className="font-medium text-green-900">
                  {venue.sports.find(s => s.id === selectedSport)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Date:</span>
                <span className="font-medium text-green-900">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Time:</span>
                <span className="font-medium text-green-900">
                  {formatTime(selectedSlotData.startTime)} - {formatTime(selectedSlotData.endTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Court:</span>
                <span className="font-medium text-green-900">{selectedSlotData.courtName}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-green-200">
                <span className="text-green-700">Total:</span>
                <span className="text-green-900">₹{selectedSlotData.price}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Book Now Button */}
        <Button
          onClick={onBookNow}
          disabled={!selectedSlot}
          className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          {selectedSlot ? `Book Now - ₹${selectedSlotData?.price}` : 'Select a Time Slot'}
        </Button>

        {/* Trust Indicators */}
        <div className="pt-4 border-t border-green-100">
          <div className="flex items-center justify-center gap-4 text-xs text-green-600">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Secure Payment</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingWidget;
