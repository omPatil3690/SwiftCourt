import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { Star, MapPin, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

interface Court {
  id: string;
  name: string;
  sport: string;
  location: string;
  pricePerHour: number;
  rating: number;
  image: string;
  description: string;
  amenities: string[];
  availability: string;
}

const courts: Court[] = [
  {
    id: '1',
    name: 'Premium Tennis Academy',
    sport: 'Tennis',
    location: 'Downtown Sports Complex',
    pricePerHour: 45,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Professional-grade courts with premium lighting and surface',
    amenities: ['Professional Lighting', 'Equipment Rental', 'Coaching Available'],
    availability: 'Available Today'
  },
  {
    id: '2',
    name: 'Urban Basketball Hub',
    sport: 'Basketball',
    location: 'City Center Arena',
    pricePerHour: 35,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Indoor courts with professional-grade flooring and equipment',
    amenities: ['Air Conditioning', 'Sound System', 'Scoreboards'],
    availability: '3 slots today'
  },
  {
    id: '3',
    name: 'Elite Badminton Center',
    sport: 'Badminton',
    location: 'Riverside Sports Park',
    pricePerHour: 28,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1594736797933-d0d64f86e6d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Multi-court facility with tournament-quality setup',
    amenities: ['Professional Courts', 'Equipment Rental', 'Locker Rooms'],
    availability: 'Available Now'
  },
  {
    id: '4',
    name: 'Premier Squash Club',
    sport: 'Squash',
    location: 'Metropolitan Sports Club',
    pricePerHour: 40,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Glass-backed courts with climate control and premium facilities',
    amenities: ['Glass Courts', 'Climate Control', 'Viewing Gallery'],
    availability: '2 slots today'
  },
  {
    id: '5',
    name: 'Volleyball Paradise',
    sport: 'Volleyball',
    location: 'Beach Sports Complex',
    pricePerHour: 32,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Indoor and outdoor courts with professional sand and equipment',
    amenities: ['Sand Courts', 'Net Rental', 'Shower Facilities'],
    availability: 'Available Today'
  },
  {
    id: '6',
    name: 'Championship Table Tennis',
    sport: 'Table Tennis',
    location: 'Community Sports Center',
    pricePerHour: 22,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    description: 'Professional tables in a dedicated tournament facility',
    amenities: ['Pro Tables', 'Equipment Included', 'Tournament Setup'],
    availability: '5 slots today'
  }
];

const CourtsCarousel = () => {
  const navigate = useNavigate();
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const handleBookCourt = (_courtId: string) => {
    navigate('/book');
  };

  const handleViewAll = () => {
    navigate('/book');
  };

  return (
    <section className="relative container mx-auto px-4 mb-16">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 rounded-3xl -mx-4 -my-8" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
              Book Local Courts
            </h2>
            <p className="text-muted-foreground">
              Discover and book premium sports facilities near you
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleViewAll}
            className="border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
          >
            View All Courts
          </Button>
        </div>

      <Carousel
        plugins={[plugin.current]}
        opts={{
          align: "start",
          loop: true,
        }}
        className="relative w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {courts.map((court) => (
            <CarouselItem key={court.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card 
                className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border-0 bg-white/50 backdrop-blur-sm"
                onClick={() => navigate('/book')}
              >
                <div className="relative overflow-hidden">
                  <div 
                    className="aspect-[4/3] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ 
                      backgroundImage: `url(${court.image})`,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/50" />
                    <div className="absolute top-4 left-4 transform transition-transform duration-300 group-hover:scale-110">
                      <Badge variant="secondary" className="bg-white/95 text-black font-semibold shadow-lg">
                        {court.sport}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4 transform transition-transform duration-300 group-hover:scale-110">
                      <Badge 
                        variant="default" 
                        className="bg-green-500/95 hover:bg-green-600 text-white font-semibold shadow-lg animate-pulse"
                      >
                        {court.availability}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white transform transition-transform duration-300 group-hover:translate-y-0">
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 animate-pulse" />
                        <span className="font-bold text-lg">{court.rating}</span>
                        <span className="text-sm opacity-75">(4.2k reviews)</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 drop-shadow-lg">{court.name}</h3>
                      <div className="flex items-center gap-1 text-sm opacity-90">
                        <MapPin className="h-4 w-4" />
                        <span>{court.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6 bg-gradient-to-br from-white via-white to-gray-50" onClick={(e) => e.stopPropagation()}>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {court.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {court.amenities.slice(0, 2).map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors">
                        {amenity}
                      </Badge>
                    ))}
                    {court.amenities.length > 2 && (
                      <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                        +{court.amenities.length - 2} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-700">${court.pricePerHour}/hr</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-700">Up to 4 players</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleBookCourt(court.id)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious className="hidden md:flex -left-12 bg-white/95 hover:bg-white border-2 border-blue-100 hover:border-blue-300 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 text-blue-600 hover:text-blue-700" />
        <CarouselNext className="hidden md:flex -right-12 bg-white/95 hover:bg-white border-2 border-blue-100 hover:border-blue-300 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 text-blue-600 hover:text-blue-700" />
      </Carousel>

      {/* Enhanced Mobile Navigation Indicators */}
      <div className="flex justify-center mt-8 md:hidden">
        <div className="flex gap-3">
          {courts.map((_, index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            />
          ))}
        </div>
      </div>
      </div>
    </section>
  );
};

export default CourtsCarousel;
