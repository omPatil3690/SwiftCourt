import React from 'react';
import { motion } from 'framer-motion';
import { X, Star, DollarSign, MapPin, Home, Car, Lightbulb, Droplets, Utensils, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

interface VenueFilters {
  sportType: string;
  location: string;
  priceMin: number;
  priceMax: number;
  rating: number;
  amenities: string[];
  venueType: string;
}

interface FilterSidebarProps {
  filters: VenueFilters;
  onFilterChange: (filters: Partial<VenueFilters>) => void;
  onClearAll: () => void;
  onClose?: () => void;
}

const AMENITIES = [
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'lights', label: 'Floodlights', icon: Lightbulb },
  { id: 'changing-room', label: 'Changing Room', icon: Home },
  { id: 'water', label: 'Drinking Water', icon: Droplets },
  { id: 'cafeteria', label: 'Cafeteria', icon: Utensils },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'first-aid', label: 'First Aid', icon: Shield },
  { id: 'seating', label: 'Seating', icon: Home }
];

const VENUE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' }
];

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  onClose
}) => {
  const handlePriceChange = (values: number[]) => {
    onFilterChange({
      priceMin: values[0],
      priceMax: values[1]
    });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({
      rating: filters.rating === rating ? 0 : rating
    });
  };

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    const newAmenities = checked
      ? [...filters.amenities, amenityId]
      : filters.amenities.filter(a => a !== amenityId);
    
    onFilterChange({ amenities: newAmenities });
  };

  const handleVenueTypeChange = (type: string) => {
    onFilterChange({ venueType: type });
  };

  const hasActiveFilters = 
    filters.priceMin > 0 || 
    filters.priceMax < 2000 || 
    filters.rating > 0 || 
    filters.amenities.length > 0 || 
    filters.venueType;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl p-6 shadow-sm h-fit sticky top-32"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Filters
        </h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="w-full mb-6 text-red-600 border-red-200 hover:bg-red-50"
        >
          Clear All Filters
        </Button>
      )}

      {/* Price Range */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-gray-600" />
          Price per Hour
        </h4>
        <div className="px-2">
          <Slider
            value={[filters.priceMin, filters.priceMax]}
            onValueChange={handlePriceChange}
            max={2000}
            min={0}
            step={50}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹{filters.priceMin}</span>
            <span>₹{filters.priceMax}</span>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Rating Filter */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <Star className="h-4 w-4 mr-2 text-gray-600" />
          Minimum Rating
        </h4>
        <div className="space-y-3">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={filters.rating === rating}
                onCheckedChange={() => handleRatingChange(rating)}
              />
              <label
                htmlFor={`rating-${rating}`}
                className="flex items-center cursor-pointer text-sm"
              >
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">{rating}+ stars</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Venue Type */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <Home className="h-4 w-4 mr-2 text-gray-600" />
          Venue Type
        </h4>
        <div className="space-y-2">
          {VENUE_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={filters.venueType === type.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleVenueTypeChange(type.value)}
              className="w-full justify-start"
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Amenities */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-gray-600" />
          Amenities
        </h4>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {AMENITIES.map((amenity) => {
            const IconComponent = amenity.icon;
            return (
              <div key={amenity.id} className="flex items-center space-x-3">
                <Checkbox
                  id={amenity.id}
                  checked={filters.amenities.includes(amenity.id)}
                  onCheckedChange={(checked) => 
                    handleAmenityChange(amenity.id, checked as boolean)
                  }
                />
                <label
                  htmlFor={amenity.id}
                  className="flex items-center cursor-pointer text-sm flex-1"
                >
                  <IconComponent className="h-4 w-4 mr-2 text-gray-500" />
                  {amenity.label}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Amenities */}
      {filters.amenities.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {filters.amenities.map((amenityId) => {
              const amenity = AMENITIES.find(a => a.id === amenityId);
              return (
                <Badge
                  key={amenityId}
                  variant="secondary"
                  className="text-xs px-2 py-1"
                >
                  {amenity?.label}
                  <button
                    onClick={() => handleAmenityChange(amenityId, false)}
                    className="ml-1 text-xs hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 mt-6 pt-4 border-t">
        <p>Filters help you find venues that match your preferences</p>
      </div>
    </motion.div>
  );
};

export default FilterSidebar;
