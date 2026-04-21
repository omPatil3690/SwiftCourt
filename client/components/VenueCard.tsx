import { motion } from "framer-motion";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MapPin, Star, CheckCircle, Heart, Share2, Clock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export type Venue = {
  id: string;
  name: string;
  location: string;
  images: string[];
  sports: string[];
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  type: 'indoor' | 'outdoor';
  isVerified: boolean;
};

interface VenueCardProps {
  venue: Venue;
  viewMode?: 'grid' | 'list';
  onClick?: () => void;
}

const VenueCard = ({ venue, viewMode = 'grid', onClick }: VenueCardProps) => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Previously: navigate(`/venue-details/${venue.id}`) or `/venue/${venue.id}`
      // Ensure we use the defined route in App.tsx: /venue-details/:id
      navigate(`/venue-details/${venue.id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: venue.name,
        text: `Check out ${venue.name} - ${venue.location}`,
        url: window.location.href
      });
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div 
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={handleCardClick}
        className="cursor-pointer"
      >
        <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div className="flex">
            {/* Image */}
            <div className="relative w-64 h-48 flex-shrink-0">
              {/* Loading overlay below image */}
              <div className={`absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center transition-opacity duration-300 ${isImageLoaded ? 'opacity-0' : 'opacity-100'}`}>
                {!isImageLoaded && (
                  <div className="text-white text-4xl">🏟️</div>
                )}
              </div>
              <img
                src={venue.images[0] || '/placeholder.svg'}
                alt={venue.name}
                className={`relative z-10 w-full h-full object-cover transition-opacity duration-300 ${
                  isImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
              />
              
              {/* Overlay Actions */}
              <div className="absolute z-20 top-3 right-3 flex gap-2">
                <button
                  onClick={handleFavoriteClick}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'
                    }`} 
                  />
                </button>
                <button
                  onClick={handleShareClick}
                  className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                >
                  <Share2 className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              
              {/* Type Badge */}
              <div className="absolute z-20 bottom-3 left-3">
                <Badge 
                  variant="secondary" 
                  className="bg-white/90 text-gray-700 capitalize"
                >
                  {venue.type}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-900">{venue.name}</h3>
                  {venue.isVerified && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{venue.pricePerHour}
                  </div>
                  <div className="text-sm text-gray-500">per hour</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{venue.location}</span>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-medium">{venue.rating}</span>
                  <span className="text-gray-500 text-sm">({venue.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Available today</span>
                </div>
              </div>

              {/* Sports */}
              <div className="flex flex-wrap gap-2 mb-4">
                {venue.sports.slice(0, 3).map((sport) => (
                  <Badge key={sport} variant="outline" className="text-xs">
                    {sport}
                  </Badge>
                ))}
                {venue.sports.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{venue.sports.length - 3} more
                  </Badge>
                )}
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-2 mb-4">
                {venue.amenities.slice(0, 4).map((amenity) => (
                  <span key={amenity} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {amenity}
                  </span>
                ))}
                {venue.amenities.length > 4 && (
                  <span className="text-xs text-gray-500">
                    +{venue.amenities.length - 4} more
                  </span>
                )}
              </div>

              <Button className="w-full sm:w-auto px-8">
                Book Now
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Grid view (default)
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={handleCardClick}
      className="cursor-pointer"
    >
      <Card className="overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 group">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {/* Loading overlay below image */}
          <div className={`absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center transition-opacity duration-300 ${isImageLoaded ? 'opacity-0' : 'opacity-100'}`}>
            {!isImageLoaded && (
              <div className="text-white text-4xl">🏟️</div>
            )}
          </div>
          <img
            src={venue.images[0] || '/placeholder.svg'}
            alt={venue.name}
            className={`relative z-10 w-full h-full object-cover group-hover:scale-110 transition-all duration-300 ${
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
          />
          
          {/* Overlay Actions */}
          <div className="absolute z-20 top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleFavoriteClick}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            >
              <Heart 
                className={`h-4 w-4 ${
                  isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'
                }`} 
              />
            </button>
            <button
              onClick={handleShareClick}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            >
              <Share2 className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          
          {/* Type Badge */}
          <div className="absolute z-20 bottom-3 left-3">
            <Badge 
              variant="secondary" 
              className="bg-white/90 text-gray-700 capitalize"
            >
              {venue.type}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {venue.name}
              </h3>
              {venue.isVerified && (
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <MapPin className="h-4 w-4" />
            <span className="text-sm line-clamp-1">{venue.location}</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="font-medium text-sm">{venue.rating}</span>
              <span className="text-gray-500 text-xs">({venue.reviewCount})</span>
            </div>
            <div className="text-gray-300">•</div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Clock className="h-3 w-3" />
              <span>Available</span>
            </div>
          </div>

          {/* Sports */}
          <div className="flex flex-wrap gap-1 mb-3">
            {venue.sports.slice(0, 2).map((sport) => (
              <Badge key={sport} variant="outline" className="text-xs">
                {sport}
              </Badge>
            ))}
            {venue.sports.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{venue.sports.length - 2}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-green-600">
                ₹{venue.pricePerHour}
              </div>
              <div className="text-xs text-gray-500">per hour</div>
            </div>
            <Button size="sm" className="px-4">
              Book Now
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default VenueCard;
