import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  X, 
  Clock, 
  MapPin, 
  FileText,
  Wifi,
  Car,
  Bath,
  Users,
  Zap,
  ShieldCheck,
  Coffee,
  AirVent,
  Dumbbell,
  Upload,
  Image as ImageIcon,
  Building,
  IndianRupee
} from 'lucide-react';
import { facilitiesApi, courtsApi } from '@/lib/api';
import MapPicker, { type LatLng } from '@/components/MapPicker';

interface AddCourtFormProps {
  onCourtAdded?: () => void;
  onCancel?: () => void;
}

const SPORTS_OPTIONS = [
  'Tennis',
  'Basketball', 
  'Badminton',
  'Squash',
  'Football',
  'Cricket',
  'Volleyball',
  'Table Tennis',
  'Hockey',
  'Swimming'
];

const AMENITIES_OPTIONS = [
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'shower', label: 'Shower/Changing Rooms', icon: Bath },
  { id: 'locker', label: 'Lockers', icon: Users },
  { id: 'lighting', label: 'Professional Lighting', icon: Zap },
  { id: 'security', label: '24/7 Security', icon: ShieldCheck },
  { id: 'cafe', label: 'Café/Refreshments', icon: Coffee },
  { id: 'ac', label: 'Air Conditioning', icon: AirVent },
  { id: 'equipment', label: 'Equipment Rental', icon: Dumbbell },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const time12 = hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
  return { value: hour * 60, label: time12 }; // Convert to minutes from midnight
});

const PROPERTY_TYPES = [
  { id: 'PLAY', label: 'Play' },
  { id: 'BOOK', label: 'Book' },
  { id: 'TRAIN', label: 'Train' },
] as const;

export default function AddCourtForm({ onCourtAdded, onCancel }: AddCourtFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [coords, setCoords] = useState<LatLng | null>(null);

  // Form state - simplified with no required fields
  const [formData, setFormData] = useState({
    // Facility details
    facilityName: '',
    location: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    sports: [] as string[],
    amenities: [] as string[],
    // new property types
    propertyTypes: ['BOOK'] as string[],
    // geo
    latitude: '' as string | number,
    longitude: '' as string | number,
    
    // Court details
    courtName: '',
    pricePerHour: '',
    openTime: 6 * 60, // 6:00 AM in minutes
    closeTime: 22 * 60, // 10:00 PM in minutes
    capacity: '',
    courtType: 'indoor' as 'indoor' | 'outdoor',
    
    // Additional details
    rules: '',
    notes: ''
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSport = (sport: string) => {
    if (!formData.sports.includes(sport)) {
      updateFormData('sports', [...formData.sports, sport]);
    }
  };

  const removeSport = (sport: string) => {
    updateFormData('sports', formData.sports.filter(s => s !== sport));
  };

  const toggleAmenity = (amenityId: string) => {
    const amenities = formData.amenities.includes(amenityId)
      ? formData.amenities.filter(a => a !== amenityId)
      : [...formData.amenities, amenityId];
    updateFormData('amenities', amenities);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  // Image upload handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Basic validation - only check if at least facility name or court name exists
    if (!formData.facilityName.trim() && !formData.courtName.trim()) {
      toast.error('Please provide either a facility name or court name');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare facility data
      const facilityData = {
        name: formData.facilityName || 'New Facility',
        location: formData.location || 'Location TBD',
        description: formData.description || 'No description provided',
        sports: formData.sports.length > 0 ? formData.sports : ['General'],
        amenities: formData.amenities,
        images: images,
        address: formData.address,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail || user?.email || '',
        // Include coordinates if available (backend can ignore if not supported)
        latitude: coords?.lat,
        longitude: coords?.lng,
        propertyTypes: formData.propertyTypes,
      } as any;

      const facility = await facilitiesApi.create(facilityData) as any;
      
      // Prepare court data
      const courtData = {
        name: formData.courtName || 'Court 1',
        facilityId: facility.id,
        pricePerHour: parseFloat(formData.pricePerHour) || 0,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        capacity: parseInt(formData.capacity) || 10,
        courtType: formData.courtType
      };

      await courtsApi.create(courtData);

      toast.success('Venue added successfully! Your facility is now pending admin approval.');
      
      // Reset form
      setFormData({
        facilityName: '',
        location: '',
        description: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
        sports: [],
        amenities: [],
        propertyTypes: ['BOOK'],
        latitude: '',
        longitude: '',
        courtName: '',
        pricePerHour: '',
        openTime: 6 * 60,
        closeTime: 22 * 60,
        capacity: '',
        courtType: 'indoor',
        rules: '',
        notes: ''
      });
      setImages([]);
      setCoords(null);
      
      onCourtAdded?.();
    } catch (error: any) {
      console.error('Failed to create venue:', error);
      toast.error(error.message || 'Failed to create venue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-green-600" />
            Add New Venue
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a new sports facility. All fields are optional - add as much detail as you'd like.
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Facility Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Facility Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Facility Name */}
              <div className="space-y-2">
                <Label htmlFor="facilityName" className="text-sm font-medium">
                  Facility Name
                </Label>
                <Input
                  id="facilityName"
                  placeholder="e.g., Elite Sports Complex"
                  value={formData.facilityName}
                  onChange={(e) => updateFormData('facilityName', e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Downtown, City Center"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Tip: Use the map below to drop a pin; this field will update automatically.</p>
              </div>

              {/* Contact Phone */}
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-sm font-medium">
                  Contact Phone
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="e.g., +1 (555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) => updateFormData('contactPhone', e.target.value)}
                />
              </div>

              {/* Contact Email */}
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-sm font-medium">
                  Contact Email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="e.g., info@facility.com"
                  value={formData.contactEmail}
                  onChange={(e) => updateFormData('contactEmail', e.target.value)}
                />
              </div>
            </div>

            {/* Property Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Property Types</Label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map(pt => (
                  <Button
                    key={pt.id}
                    type="button"
                    variant={formData.propertyTypes.includes(pt.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const exists = formData.propertyTypes.includes(pt.id);
                      const next = exists
                        ? formData.propertyTypes.filter(x => x !== pt.id)
                        : [...formData.propertyTypes, pt.id];
                      updateFormData('propertyTypes', next);
                    }}
                  >
                    {pt.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Choose one or more to describe what you offer at this venue.</p>
            </div>

            {/* Full Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Full Address
              </Label>
              <Textarea
                id="address"
                placeholder="e.g., 123 Sports Street, Downtown District, City 12345"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                rows={2}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your facility, its features, and what makes it special..."
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Map Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" /> Pick Exact Location
              </Label>
              <MapPicker
                value={coords}
                onChange={(c) => {
                  setCoords(c);
                  updateFormData('latitude', c.lat);
                  updateFormData('longitude', c.lng);
                }}
                onAddressChange={(addr) => {
                  if (!formData.address) updateFormData('address', addr);
                  if (!formData.location) updateFormData('location', addr.split(',')[0] || addr);
                }}
                height={340}
                className="rounded-lg overflow-hidden border"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div><strong>Latitude:</strong> {coords?.lat?.toFixed?.(6) ?? '—'}</div>
                <div><strong>Longitude:</strong> {coords?.lng?.toFixed?.(6) ?? '—'}</div>
                <div className="truncate"><strong>Address:</strong> {formData.address || '—'}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sports & Amenities */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Sports & Amenities</h3>
            </div>

            {/* Sports */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sports Offered</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {SPORTS_OPTIONS.map((sport) => (
                  <Button
                    key={sport}
                    type="button"
                    variant={formData.sports.includes(sport) ? "default" : "outline"}
                    size="sm"
                    onClick={() => formData.sports.includes(sport) ? removeSport(sport) : addSport(sport)}
                    className="justify-start"
                  >
                    {sport}
                  </Button>
                ))}
              </div>
              {formData.sports.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.sports.map((sport) => (
                    <Badge key={sport} variant="secondary" className="gap-1">
                      {sport}
                      <button
                        onClick={() => removeSport(sport)}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Amenities Available</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES_OPTIONS.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={formData.amenities.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      <Label
                        htmlFor={amenity.id}
                        className="text-sm flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        {amenity.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator />

          {/* Court Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Court Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Court Name */}
              <div className="space-y-2">
                <Label htmlFor="courtName" className="text-sm font-medium">
                  Court Name
                </Label>
                <Input
                  id="courtName"
                  placeholder="e.g., Court 1, Tennis Court A"
                  value={formData.courtName}
                  onChange={(e) => updateFormData('courtName', e.target.value)}
                />
              </div>

              {/* Court Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Court Type</Label>
                <Select
                  value={formData.courtType}
                  onValueChange={(value: 'indoor' | 'outdoor') => updateFormData('courtType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indoor">Indoor</SelectItem>
                    <SelectItem value="outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price per Hour */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Price per Hour (₹)
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g., 500"
                  value={formData.pricePerHour}
                  onChange={(e) => updateFormData('pricePerHour', e.target.value)}
                />
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-sm font-medium">
                  Max Capacity (people)
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="e.g., 10"
                  value={formData.capacity}
                  onChange={(e) => updateFormData('capacity', e.target.value)}
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Operating Hours
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openTime" className="text-xs text-muted-foreground">
                    Opening Time
                  </Label>
                  <Select
                    value={formData.openTime.toString()}
                    onValueChange={(value) => updateFormData('openTime', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time.value} value={time.value.toString()}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="closeTime" className="text-xs text-muted-foreground">
                    Closing Time
                  </Label>
                  <Select
                    value={formData.closeTime.toString()}
                    onValueChange={(value) => updateFormData('closeTime', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.filter(time => time.value > formData.openTime).map((time) => (
                        <SelectItem key={time.value} value={time.value.toString()}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Hours: {formatTime(formData.openTime)} - {formatTime(formData.closeTime)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Images Upload */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Photos</h3>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-green-600 hover:text-green-700">
                        Upload photos
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        or drag and drop
                      </span>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Additional Information</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Rules */}
              <div className="space-y-2">
                <Label htmlFor="rules" className="text-sm font-medium">
                  Rules & Guidelines
                </Label>
                <Textarea
                  id="rules"
                  placeholder="e.g., No outside food allowed, Proper sports attire required..."
                  value={formData.rules}
                  onChange={(e) => updateFormData('rules', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any other information about your facility..."
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Submit Actions */}
          <div className="flex justify-between items-center pt-6">
            <div className="text-sm text-muted-foreground">
              Your venue will be reviewed by our team before being published.
            </div>
            
            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Creating...' : 'Create Venue'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
