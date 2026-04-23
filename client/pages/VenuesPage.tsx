import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, Calendar, Filter, SlidersHorizontal, Grid3X3, List, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import BrandNav from '../components/BrandNav';
import VenueCard from '../components/VenueCard';
import FilterSidebar from '../components/FilterSidebar';
import SEO from '../components/SEO';
import { facilitiesApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';

interface Venue {
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

interface VenueFilters {
  sportType: string;
  location: string;
  priceMin: number;
  priceMax: number;
  rating: number;
  amenities: string[];
  venueType: string;
}

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' }
];

const SPORTS_OPTIONS = [
  'All Sports',
  'Badminton',
  'Tennis',
  'Football',
  'Cricket',
  'Basketball',
  'Table Tennis',
  'Squash',
  'Swimming',
  'Volleyball',
  'Pickleball'
];

const VenuesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Determine page context based on route
  const getPageContext = () => {
    const path = location.pathname;
    switch (path) {
      case '/play':
        return {
          title: 'Find Courts to Play',
          subtitle: 'Discover the perfect courts for recreational play',
          defaultSports: ['Badminton', 'Tennis', 'Football'],
          icon: '🏸'
        };
      case '/book':
        return {
          title: 'Book Your Court',
          subtitle: 'Reserve courts for matches and events',
          defaultSports: ['All Sports'],
          icon: '📅'
        };
      case '/train':
        return {
          title: 'Training Facilities',
          subtitle: 'Professional coaching and training venues',
          defaultSports: ['Tennis', 'Badminton', 'Cricket'],
          icon: '🏆'
        };
      default:
        return {
          title: 'Find Sports Venues',
          subtitle: 'Discover and book the best sports facilities',
          defaultSports: ['All Sports'],
          icon: '🏟️'
        };
    }
  };

  const pageContext = getPageContext();
  
  // State
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search and filter state
  const [searchLocation, setSearchLocation] = useState(searchParams.get('location') || '');
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'All Sports');
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');
  
  const [filters, setFilters] = useState<VenueFilters>({
    sportType: searchParams.get('sport') || '',
    location: searchParams.get('location') || '',
    priceMin: Number(searchParams.get('priceMin')) || 0,
    priceMax: Number(searchParams.get('priceMax')) || 2000,
    rating: Number(searchParams.get('rating')) || 0,
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || [],
    venueType: searchParams.get('venueType') || ''
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  // Mock data - replace with actual API call
  // Removed mockVenues. Use real API below.

  // Fetch venues
  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      // Use real API call
      const response = await facilitiesApi.list({
        sport: filters.sportType,
        q: filters.location,
        page: currentPage,
        pageSize: 12
      });
      // Map Facility[] to Venue[] for frontend
      const mappedVenues = (response.items || []).map((facility) => ({
        id: facility.id,
        name: facility.name,
        location: facility.location,
        images: facility.images || [],
        sports: facility.sports || [],
        pricePerHour: facility.courts?.[0]?.pricePerHour ?? 0,
        rating: 0, // No rating field in Court, set to 0 or fetch from reviews
        reviewCount: 0, // You can update this if you have review data
        amenities: facility.amenities || [],
        type: 'indoor' as 'indoor' | 'outdoor',
        isVerified: facility.status === 'APPROVED',
      }));
      setVenues(mappedVenues);
      setTotalResults(response.total || mappedVenues.length);
      setTotalPages(Math.ceil((response.total || mappedVenues.length) / 12));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: "Error",
        description: "Failed to load venues. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Update URL params
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.sportType) params.set('sport', filters.sportType);
    if (selectedDate) params.set('date', selectedDate);
    if (sortBy !== 'popular') params.set('sort', sortBy);
    if (filters.priceMin > 0) params.set('priceMin', filters.priceMin.toString());
    if (filters.priceMax < 2000) params.set('priceMax', filters.priceMax.toString());
    if (filters.rating > 0) params.set('rating', filters.rating.toString());
    if (filters.amenities.length > 0) params.set('amenities', filters.amenities.join(','));
    if (filters.venueType) params.set('venueType', filters.venueType);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    setSearchParams(params);
  };

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      location: searchLocation,
      sportType: selectedSport === 'All Sports' ? '' : selectedSport
    }));
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<VenueFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      sportType: '',
      location: '',
      priceMin: 0,
      priceMax: 2000,
      rating: 0,
      amenities: [],
      venueType: ''
    });
    setSearchLocation('');
    setSelectedSport('All Sports');
    setSelectedDate('');
    setSortBy('popular');
    setCurrentPage(1);
  };

  // Effects
  useEffect(() => {
    fetchVenues();
  }, [filters, sortBy, currentPage]);

  useEffect(() => {
    updateSearchParams();
  }, [filters, sortBy, currentPage, selectedDate]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 pt-[72px]">
      <SEO 
        title={`${pageContext.title} - QuickCourt`}
        description={`${pageContext.subtitle}. Filter by sport, location, price and more.`}
      />
      
      <BrandNav />
      
      {/* Search Bar - Sticky */}
      <div className="sticky top-[72px] z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Inputs */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search location"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-10 h-10 sm:h-12"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="w-full sm:w-40 h-10 sm:h-12">
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS_OPTIONS.map(sport => (
                    <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 w-full sm:w-40 h-10 sm:h-12"
                />
              </div>
            </div>

            {/* Search Button & Mobile Filter Toggle */}
            <div className="flex gap-2 sm:gap-3">
              <Button onClick={handleSearch} className="flex-1 sm:flex-none h-10 sm:h-12 px-6 sm:px-8">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="lg:hidden h-10 sm:h-12 px-4"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filter Sidebar - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearAll={clearAllFilters}
            />
          </div>

          {/* Mobile Filter Overlay */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 lg:hidden"
              >
                <div 
                  className="absolute inset-0 bg-black/50" 
                  onClick={() => setIsFilterOpen(false)}
                />
                <motion.div
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto"
                >
                  <FilterSidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearAll={clearAllFilters}
                    onClose={() => setIsFilterOpen(false)}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">{pageContext.icon}</span>
                  <span className="line-clamp-1">
                    {pageContext.title} {filters.location && `in ${filters.location}`}
                  </span>
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {isLoading ? 'Loading...' : `${totalResults} venues found`} • {pageContext.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Toggle - Hidden on mobile */}
                <div className="hidden md:flex border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.sportType || filters.rating > 0 || filters.amenities.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.sportType && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {filters.sportType}
                    <button
                      onClick={() => handleFilterChange({ sportType: '' })}
                      className="ml-2 text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.rating > 0 && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {filters.rating}+ Stars
                    <button
                      onClick={() => handleFilterChange({ rating: 0 })}
                      className="ml-2 text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.amenities.map(amenity => (
                  <Badge key={amenity} variant="secondary" className="px-3 py-1">
                    {amenity}
                    <button
                      onClick={() => handleFilterChange({ 
                        amenities: filters.amenities.filter(a => a !== amenity) 
                      })}
                      className="ml-2 text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </Button>
              </div>
            )}

            {/* Venues Grid */}
            {isLoading ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                    <Skeleton className="h-48 w-full rounded-lg mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : venues.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🏟️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={clearAllFilters} variant="outline">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}
              >
                {venues.map((venue) => (
                  <motion.div
                    key={venue.id}
                    variants={cardVariants}
                    layout
                  >
                    <VenueCard 
                      venue={venue} 
                      viewMode={viewMode}
                      onClick={() => navigate(`/venue-details/${venue.id}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(i + 1)}
                      className="w-10"
                    >
                      {i + 1}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenuesPage;
