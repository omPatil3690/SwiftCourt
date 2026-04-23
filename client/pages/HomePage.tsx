import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, ChevronDown, Star, ArrowRight, Users, Clock, Trophy, Play, CheckCircle, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { facilitiesApi } from '../lib/api';
import BrandNav from '../components/BrandNav';
import VenueCard from '../components/VenueCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel';
import SEO from '../components/SEO';

interface Venue {
  id: string;
  name: string;
  location: string;
  sport: string;
  rating: number;
  pricePerHour: number;
  images?: string[]; // Add images property
}

interface VenueCardData {
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
}

interface Sport {
  id: string;
  name: string;
  icon: string;
  image: string;
  venueCount: number;
}

// Utility function to get sport icons
const getSportIcon = (sport: string): string => {
  const sportIcons: Record<string, string> = {
    'Badminton': '🏸',
    'Tennis': '🎾',
    'Football': '⚽',
    'Cricket': '🏏',
    'Basketball': '🏀',
    'Table Tennis': '🏓',
    'Squash': '🎾',
    'Swimming': '🏊',
    'Volleyball': '🏐',
    'Pickleball': '🏓',
  };
  return sportIcons[sport] || '🏟️';
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [topRatedVenues, setTopRatedVenues] = useState<Venue[]>([]);
  const [popularSports, setPopularSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Convert old venue format to new VenueCard format
  const convertVenueFormat = (venue: Venue): VenueCardData => ({
    id: venue.id,
    name: venue.name,
    location: venue.location,
    images: venue.images && venue.images.length > 0 ? venue.images : ['/placeholder.svg'], // Use actual images or fallback
    sports: [venue.sport],
    pricePerHour: venue.pricePerHour,
    rating: 0, // No fake ratings - only real user ratings
    reviewCount: 0, // No fake review count
    amenities: ['Parking', 'Changing Room'], // Mock amenities
    type: Math.random() > 0.5 ? 'indoor' : 'outdoor', // Random type
    isVerified: Math.random() > 0.3 // 70% chance of being verified
  });

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch real data from API
        const facilitiesResponse = await facilitiesApi.list({ pageSize: 20 });
        const facilities = facilitiesResponse.items;

        // Generate sports data from facilities
        const sportsMap = new Map<string, number>();
        facilities.forEach(facility => {
          facility.sports.forEach(sport => {
            sportsMap.set(sport, (sportsMap.get(sport) || 0) + 1);
          });
        });

        // Define all available sports that should always be shown
        const allAvailableSports = [
          'Badminton', 'Tennis', 'Football', 'Cricket', 'Basketball', 
          'Table Tennis', 'Squash', 'Swimming', 'Volleyball', 'Pickleball'
        ];

        const sportsData: Sport[] = allAvailableSports.map((sport, index) => ({
          id: (index + 1).toString(),
          name: sport,
          icon: getSportIcon(sport),
          image: '/placeholder.svg',
          venueCount: sportsMap.get(sport) || 0 // Show 0 if no venues found
        }));

        // Fallback sports when none available
        const defaultSports: Sport[] = [
          { id: '1', name: 'Badminton', icon: '🏸', image: '/placeholder.svg', venueCount: 0 },
          { id: '2', name: 'Tennis', icon: '🎾', image: '/placeholder.svg', venueCount: 0 },
          { id: '3', name: 'Football', icon: '⚽', image: '/placeholder.svg', venueCount: 0 },
          { id: '4', name: 'Cricket', icon: '🏏', image: '/placeholder.svg', venueCount: 0 },
        ];
        const finalSports = sportsData.length > 0 ? sportsData : defaultSports;

        // Generate venues data from facilities
        const venuesData: Venue[] = facilities
          .filter(facility => facility.status === 'APPROVED')
          .slice(0, 3)
          .map(facility => ({
            id: facility.id,
            name: facility.name,
            location: facility.location,
            sport: facility.sports[0] || 'General',
            rating: 0, // only real user ratings in future
            pricePerHour: facility.courts.length > 0 ? 
              facility.courts.reduce((sum, court) => sum + court.pricePerHour, 0) / facility.courts.length :
              500,
            images: facility.images || [] // Include actual images from facility data
          }));

        // Fallback venues when none available
        const defaultVenues: Venue[] = [
          { id: 'placeholder-1', name: 'Sample Sports Arena', location: 'Your City', sport: 'Badminton', rating: 0, pricePerHour: 500 },
          { id: 'placeholder-2', name: 'Community Courts', location: 'Your City', sport: 'Tennis', rating: 0, pricePerHour: 500 },
          { id: 'placeholder-3', name: 'Urban Play Zone', location: 'Your City', sport: 'Football', rating: 0, pricePerHour: 500 },
        ];
        const finalVenues = venuesData.length > 0 ? venuesData : defaultVenues;

        setPopularSports(finalSports);
        setTopRatedVenues(finalVenues);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to default data if API fails
        setPopularSports([
          { id: '1', name: 'Badminton', icon: '🏸', image: '/placeholder.svg', venueCount: 0 },
          { id: '2', name: 'Tennis', icon: '🎾', image: '/placeholder.svg', venueCount: 0 },
          { id: '3', name: 'Football', icon: '⚽', image: '/placeholder.svg', venueCount: 0 },
          { id: '4', name: 'Cricket', icon: '🏏', image: '/placeholder.svg', venueCount: 0 },
          { id: '5', name: 'Basketball', icon: '🏀', image: '/placeholder.svg', venueCount: 0 },
          { id: '6', name: 'Table Tennis', icon: '🏓', image: '/placeholder.svg', venueCount: 0 },
          { id: '7', name: 'Squash', icon: '🎾', image: '/placeholder.svg', venueCount: 0 },
          { id: '8', name: 'Swimming', icon: '🏊', image: '/placeholder.svg', venueCount: 0 },
          { id: '9', name: 'Volleyball', icon: '🏐', image: '/placeholder.svg', venueCount: 0 },
          { id: '10', name: 'Pickleball', icon: '🏓', image: '/placeholder.svg', venueCount: 0 },
        ]);
        setTopRatedVenues([
          { id: 'placeholder-1', name: 'Sample Sports Arena', location: 'Your City', sport: 'Badminton', rating: 0, pricePerHour: 500 },
          { id: 'placeholder-2', name: 'Community Courts', location: 'Your City', sport: 'Tennis', rating: 0, pricePerHour: 500 },
          { id: 'placeholder-3', name: 'Urban Play Zone', location: 'Your City', sport: 'Football', rating: 0, pricePerHour: 500 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (selectedSport) params.append('sport', selectedSport);
    if (selectedDate) params.append('date', selectedDate);
    
    navigate(`/venues?${params.toString()}`);
  };

  const handleSportClick = (sportName: string) => {
    navigate(`/venues?sport=${encodeURIComponent(sportName)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="QuickCourt - Book Sports Facilities Near You"
        description="Choose a sport, find a court, and start playing. Book badminton, tennis, football and more courts instantly."
      />
      
      {/* Navigation */}
      <BrandNav />

      {/* Hero Search Banner */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background with overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70 z-10"></div>
          <div className="w-full h-full bg-gradient-to-br from-green-600 via-green-500 to-green-400">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
              <motion.div 
                className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white rounded-full"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, delay: 2 }}
              />
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center text-white px-4 max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-2">
              Book Sports Facilities
              <span className="block text-green-400">Near You</span>
            </h1>
            
            <motion.p
              className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 text-gray-200 max-w-3xl mx-auto px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Choose a sport, find a court, and start playing
            </motion.p>

            {/* Search Bar - Mobile Optimized */}
            <motion.div
              className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 max-w-5xl mx-auto shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {/* Location */}
                <div className="relative sm:col-span-2 md:col-span-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    type="text"
                    placeholder="Enter location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="pl-9 sm:pl-10 h-12 sm:h-14 text-gray-900 placeholder:text-gray-500 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl text-sm sm:text-base"
                  />
                </div>

                {/* Sport Selection */}
                <div className="sm:col-span-1 md:col-span-1">
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger className="h-12 sm:h-14 bg-white text-gray-900 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl text-sm sm:text-base">
                      <SelectValue placeholder="Select sport" className="text-gray-500" />
                    </SelectTrigger>
                    <SelectContent>
                      {popularSports.map((sport) => (
                        <SelectItem key={sport.id} value={sport.name}>
                          <span className="flex items-center gap-2">
                            <span>{sport.icon}</span>
                            {sport.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date */}
                <div className="relative sm:col-span-1 md:col-span-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-9 sm:pl-10 h-12 sm:h-14 text-gray-900 placeholder:text-gray-500 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl text-sm sm:text-base"
                  />
                </div>

                {/* Search Button */}
                <div className="sm:col-span-2 md:col-span-1">
                  <Button
                    onClick={handleSearch}
                    size="lg"
                    className="w-full h-12 sm:h-14 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                  >
                    <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Sports Categories Carousel */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-8 sm:mb-12 px-4"
            {...fadeInUp}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Choose Your Sport
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Browse by sport and find the perfect venue
            </p>
          </motion.div>

          {/* Sports Carousel */}
          <Carousel
            className="w-full max-w-7xl mx-auto"
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <div className="relative">
              <CarouselContent className="-ml-2 md:-ml-4">
                {popularSports.map((sport) => (
                  <CarouselItem key={sport.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <motion.div
                      className="p-1"
                      variants={fadeInUp}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200"
                        onClick={() => handleSportClick(sport.name)}
                      >
                        <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                          <div className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3">{sport.icon}</div>
                          <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm md:text-base">{sport.name}</h3>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4 lg:-left-12 bg-white hover:bg-green-50 border-gray-200 hover:border-green-400 shadow-md text-green-600" />
              <CarouselNext className="hidden sm:flex -right-4 lg:-right-12 bg-white hover:bg-green-50 border-gray-200 hover:border-green-400 shadow-md text-green-600" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* Featured Venues Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-8 sm:mb-12 md:mb-16 px-4"
            {...fadeInUp}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Top Rated Venues Near You
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Discover highly-rated sports facilities in your area
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <Carousel
              className="w-full max-w-7xl mx-auto"
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <div className="relative">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {topRatedVenues.map((venue) => (
                    <CarouselItem key={venue.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <motion.div
                        className="p-1"
                        variants={fadeInUp}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                      >
                        <VenueCard venue={convertVenueFormat(venue)} />
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex -left-4 lg:-left-12 bg-white hover:bg-green-50 border-gray-200 hover:border-green-400 shadow-md text-green-600" />
                <CarouselNext className="hidden sm:flex -right-4 lg:-right-12 bg-white hover:bg-green-50 border-gray-200 hover:border-green-400 shadow-md text-green-600" />
              </div>
            </Carousel>
          )}

          <motion.div
            className="text-center mt-12"
            {...fadeInUp}
          >
            <Button
              onClick={() => navigate('/book')}
              size="lg"
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 px-8 py-3 rounded-xl font-semibold"
            >
              View All Venues
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Join Community Banner - hidden when logged in */}
      {!user && (
        <section className="py-12 sm:py-16 md:py-20 bg-green-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500"></div>
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center text-white"
              {...fadeInUp}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                Join Thousands of Players and Facility Owners
              </h2>
              <p className="text-lg sm:text-xl text-green-100 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
                Become part of India's largest sports community. Play, connect, and grow together.
              </p>
              <Button
                onClick={() => navigate('/signup')}
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Users className="h-5 sm:h-6 w-5 sm:w-6 mr-2" />
                Sign Up for Free
              </Button>
            </motion.div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            {...fadeInUp}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Get on the field in 3 simple steps
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                step: "1",
                icon: <Search className="h-10 w-10" />,
                title: "Search",
                description: "Find sports facilities near you by location, sport, and availability"
              },
              {
                step: "2", 
                icon: <Calendar className="h-10 w-10" />,
                title: "Book",
                description: "Select your preferred time slot and complete secure online payment"
              },
              {
                step: "3",
                icon: <Play className="h-10 w-10" />,
                title: "Play",
                description: "Show up and enjoy your game at the booked facility"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="text-center relative"
                variants={fadeInUp}
              >
                <div className="bg-green-500 text-white rounded-full w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  {item.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {item.description}
                </p>
                
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-8 sm:top-10 -right-6 h-6 sm:h-8 w-6 sm:w-8 text-green-400" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Snapshot */}
      <section className="py-16 md:py-24 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-br from-green-600 to-emerald-500 bg-clip-text text-transparent">
              About QuickCourt
            </h2>
            <p className="mt-4 text-gray-600 text-lg leading-relaxed">
              We connect players, facility owners and coaches through seamless booking, real-time availability and a rewarding activity ecosystem.
            </p>
          </motion.div>

            <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-16">
              {[
                { icon: <Users className="h-6 w-6" />, title: 'Community First', desc: 'Tools that amplify grassroots sports participation.' },
                { icon: <Shield className="h-6 w-6" />, title: 'Secure & Fair', desc: 'Verified venues, protected sessions & transparent policies.' },
                { icon: <Trophy className="h-6 w-6" />, title: 'Gamified Progress', desc: 'Points, streaks & badges keep you motivated to play more.' },
                { icon: <Sparkles className="h-6 w-6" />, title: 'Continuous Innovation', desc: 'Rapid iteration on performance, realtime, and PWA features.' }
              ].map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-50 hover:bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center mb-4">
                    {v.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-10 items-center">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">What We've Built So Far</h3>
                <p className="text-gray-600 leading-relaxed">A fast-moving platform layering booking logistics with engagement mechanics.</p>
                <ul className="space-y-3 text-sm">
                  {[
                    'Unified multi-sport booking experience',
                    'Realtime availability scaffolding',
                    'Loyalty points + streak tracking',
                    'Referral & sharing flows',
                    'Admin & owner role segregation'
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2">
                  <button onClick={() => navigate('/about')} className="text-green-600 font-semibold hover:text-green-700 inline-flex items-center gap-1 group">
                    Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl p-8 overflow-hidden text-white shadow-lg">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" />
                <div className="relative z-10 space-y-4">
                  <h3 className="text-xl font-semibold">Why It Matters</h3>
                  <p className="text-sm leading-relaxed text-green-50">Access, consistency, and community are the pillars that keep people active. QuickCourt lowers friction while boosting motivation and trust.</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-bold text-white">01</p>
                      <p className="text-green-50">Reduced booking friction</p>
                    </div>
                    <div>
                      <p className="font-bold text-white">02</p>
                      <p className="text-green-50">Higher venue utilization</p>
                    </div>
                    <div>
                      <p className="font-bold text-white">03</p>
                      <p className="text-green-50">Player retention via rewards</p>
                    </div>
                    <div>
                      <p className="font-bold text-white">04</p>
                      <p className="text-green-50">Transparent platform growth</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
