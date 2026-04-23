import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  Activity, 
  PlusCircle, 
  Calendar, 
  Trophy, 
  Building, 
  MapPin, 
  Clock, 
  Users, 
  TrendingUp,
  Trash2,
  Star,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal,
  IndianRupee
} from 'lucide-react';
import SEO from '../components/SEO';
import BrandNav from '../components/BrandNav';
import AddCourtForm from '../components/AddCourtForm';
import { courtsApi, bookingsApi } from '../lib/api';
import { toast } from 'sonner';
import { io as ioClient, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../lib/api';

const OwnerDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ownerStats, setOwnerStats] = useState<{ totalBookings: number; payments: { succeeded: number; refunded: number; net: number } } | null>(null);

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
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

  const loadOwnerStats = async () => {
    try {
      const stats = await bookingsApi.getOwnerStats();
      setOwnerStats(stats);
    } catch (e) {
      // ignore silently
    }
  };

  useEffect(() => {
    if (!isLoading && user?.role === 'OWNER') {
      loadOwnerStats();
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login', { replace: true });
      } else if (user.role !== 'OWNER') {
        navigate('/', { replace: true });
      } else {
        fetchOwnerCourts();
        // connect socket for owner
        const token = localStorage.getItem('accessToken');
        const s = ioClient(API_BASE_URL, { auth: { token } });
        setSocket(s);
        s.on('connect', () => {
          console.log('Socket connected (owner)');
        });
        s.on('booking:new', (payload: any) => {
          // New booking on any of my facilities
          toast.success('New booking received');
          fetchOwnerCourts();
          loadOwnerStats();
        });
        s.on('booking:cancelled', (payload: any) => {
          toast('A booking was cancelled');
          fetchOwnerCourts();
          loadOwnerStats();
        });
        return () => {
          s.disconnect();
        };
      }
    }
  }, [user, isLoading, navigate]);

  const fetchOwnerCourts = async () => {
    try {
      setLoading(true);
      const ownerCourts = await courtsApi.getOwnerCourts();
      setCourts(ownerCourts);
    } catch (error) {
      console.error('Failed to fetch courts:', error);
      toast.error('Failed to load your courts');
    } finally {
      setLoading(false);
    }
  };

  const handleCourtAdded = () => {
    setShowAddForm(false);
    setActiveTab('overview');
    fetchOwnerCourts();
    toast.success('Venue added successfully!');
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'default';
      case 'PENDING': return 'secondary';
      case 'REJECTED': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'REJECTED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Calculate dashboard stats
  const dashboardStats = {
    totalCourts: courts.length,
    approvedCourts: courts.filter(c => c.facility.status === 'APPROVED').length,
    pendingCourts: courts.filter(c => c.facility.status === 'PENDING').length,
    totalBookings: ownerStats?.totalBookings ?? courts.reduce((sum, court) => sum + court._count.bookings, 0),
    avgPrice: courts.length > 0 
      ? (courts.reduce((sum, court) => sum + Number(court.pricePerHour), 0) / courts.length).toFixed(0)
      : '0',
    monthlyRevenue: ownerStats?.payments.net ?? courts.reduce((sum, court) => sum + (Number(court.pricePerHour) * court._count.bookings * 2), 0)
  };

  // Filter courts based on search and status
  const filteredCourts = courts.filter(court => {
    const matchesSearch = court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         court.facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         court.facility.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || court.facility.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading || !user || user.role !== 'OWNER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <BrandNav />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <SEO title="Add New Venue - Owner Dashboard" description="Add a new venue to your portfolio" />
        <BrandNav />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <AddCourtForm 
              onCourtAdded={handleCourtAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <SEO title="Owner Dashboard - QuickCourt" description="Manage your sports facilities and venues" />
      <BrandNav />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <motion.div 
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.fullName}!
              </h1>
              <p className="text-gray-600">
                Manage your venues and track your business performance
              </p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)} 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Venue
            </Button>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={staggerItem}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Venues</CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{dashboardStats.totalCourts}</div>
                  <p className="text-sm text-green-600 font-medium">
                    {dashboardStats.approvedCourts} approved • {dashboardStats.pendingCourts} pending
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={staggerItem}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{dashboardStats.totalBookings}</div>
                  <p className="text-sm text-blue-600 font-medium">
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    All time bookings
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={staggerItem}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Average Price</CardTitle>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <IndianRupee className="h-5 w-5 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">₹{dashboardStats.avgPrice}</div>
                  <p className="text-sm text-yellow-600 font-medium">Per hour rate</p>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={staggerItem}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Est. Revenue</CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">₹{dashboardStats.monthlyRevenue.toLocaleString()}</div>
                  <p className="text-sm text-purple-600 font-medium">Estimated monthly</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm border-0 shadow-lg">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="venues" 
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  My Venues
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => setShowAddForm(true)}
                          className="h-20 flex-col gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200 hover:border-green-300"
                          variant="outline"
                        >
                          <PlusCircle className="h-6 w-6" />
                          Add New Venue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-green-600" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {courts.length > 0 ? (
                        <div className="space-y-4">
                          {courts.slice(0, 3).map((court, index) => (
                            <div key={court.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${getStatusColor(court.facility.status)}`}>
                                  {getStatusIcon(court.facility.status)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{court.facility.name}</p>
                                  <p className="text-sm text-gray-500">Court: {court.name}</p>
                                </div>
                              </div>
                              <Badge variant={getStatusVariant(court.facility.status)}>
                                {court.facility.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600 mb-4">No venues added yet</p>
                          <Button 
                            onClick={() => setShowAddForm(true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Your First Venue
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="venues" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <CardTitle className="text-xl font-semibold flex items-center gap-2">
                          <Building className="h-5 w-5 text-green-600" />
                          My Venues ({filteredCourts.length})
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search venues..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 w-full sm:w-64"
                            />
                          </div>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-40">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="APPROVED">Approved</SelectItem>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => setShowAddForm(true)} 
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Venue
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Loading venues...</p>
                        </div>
                      ) : filteredCourts.length === 0 ? (
                        <div className="text-center py-12">
                          <Building className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No venues found</h3>
                          <p className="text-gray-600 mb-6">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Try adjusting your search criteria' 
                              : 'Start by adding your first venue'
                            }
                          </p>
                          <Button 
                            onClick={() => setShowAddForm(true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Your First Venue
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Venue Details</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Bookings</TableHead>
                                {/* Removed Actions column */}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCourts.map((court) => (
                                <TableRow key={court.id} className="hover:bg-gray-50">
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-gray-900">{court.facility.name}</p>
                                      <p className="text-sm text-gray-500">{court.name}</p>
                                      <p className="text-xs text-gray-400">ID: {court.id.slice(-8)}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm">{court.facility.location}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <IndianRupee className="h-4 w-4 text-green-600" />
                                      <span className="font-medium">₹{Number(court.pricePerHour)}/hr</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm">
                                        {formatTime(court.openTime)} - {formatTime(court.closeTime)}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(court.facility.status)}`}>
                                      {getStatusIcon(court.facility.status)}
                                      {court.facility.status}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4 text-purple-600" />
                                      <span className="font-medium">{court._count.bookings}</span>
                                    </div>
                                  </TableCell>
                                  {/* Removed Actions cell */}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default OwnerDashboard;