import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { 
  Users, 
  Building, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Eye,
  Check,
  X,
  Search,
  Filter,
  BarChart3,
  Activity,
  MapPin,
  Star,
  Clock,
  Ban,
  CheckCircle,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import BrandNav from '../components/BrandNav';
import AdminAnalytics from '../components/AdminAnalytics';
import SEO from '../components/SEO';

interface DashboardStats {
  totalUsers: number;
  totalFacilities: number;
  totalBookings: number;
  totalRevenue: number;
  pendingFacilities: number;
  activeBookings: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  _count: {
    bookings: number;
    facilities: number;
  };
}

interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  sports: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
  };
  _count: {
    courts: number;
  };
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  facility: {
    id: string;
    name: string;
    location: string;
  };
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and search
  const [userFilter, setUserFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [facilityStatusFilter, setFacilityStatusFilter] = useState('all');
  const [bookingFilter, setBookingFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Dialog states
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, facilitiesRes, bookingsRes] = await Promise.all([
        api.get<DashboardStats>('/admin/stats'),
        api.get<User[]>('/admin/users'),
        api.get<Facility[]>('/admin/facilities'),
        api.get<Booking[]>('/admin/bookings')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setFacilities(facilitiesRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const approveFacility = async (facilityId: string) => {
    try {
      await api.put(`/admin/facilities/${facilityId}/approve`);
      toast.success('Facility approved successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to approve facility:', error);
      toast.error('Failed to approve facility');
    }
  };

  const rejectFacility = async (facilityId: string, reason: string) => {
    try {
      await api.put(`/admin/facilities/${facilityId}/reject`, { reason });
      toast.success('Facility rejected');
      setRejectReason('');
      setSelectedFacility(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to reject facility:', error);
      toast.error('Failed to reject facility');
    }
  };

  const banUser = async (userId: string, reason: string) => {
    try {
      await api.put(`/admin/users/${userId}/ban`, { reason });
      toast.success('User banned successfully');
      setBanReason('');
      setSelectedUser(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast.error('Failed to ban user');
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/unban`);
      toast.success('User unbanned successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast.error('Failed to unban user');
    }
  };

  // Filter data
  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(userFilter.toLowerCase()) &&
    (userRoleFilter === 'all' || user.role === userRoleFilter)
  );

  const filteredFacilities = facilities.filter(facility =>
    facility.name.toLowerCase().includes(facilityFilter.toLowerCase()) &&
    (facilityStatusFilter === 'all' || facility.status === facilityStatusFilter)
  );

  const filteredBookings = bookings.filter(booking =>
    (booking.user.fullName.toLowerCase().includes(bookingFilter.toLowerCase()) ||
     booking.facility.name.toLowerCase().includes(bookingFilter.toLowerCase())) &&
    (bookingStatusFilter === 'all' || booking.status === bookingStatusFilter)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BrandNav />
  <div className="pt-24 pb-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-muted-foreground">Loading dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Admin Dashboard - QuickCourt"
        description="Manage facilities, users, and bookings on QuickCourt"
      />
      <BrandNav />
      
  <div className="pt-24 pb-10">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your platform efficiently</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Active</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-1">
                        +{stats.userGrowth}% from last month
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Facilities</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalFacilities.toLocaleString()}</p>
                      <p className="text-xs text-orange-600 mt-1">
                        {stats.pendingFacilities} pending approval
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalBookings.toLocaleString()}</p>
                      <p className="text-xs text-purple-600 mt-1">
                        {stats.activeBookings} active bookings
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-1">
                        +{stats.revenueGrowth}% from last month
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="facilities" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 bg-white p-1 rounded-lg shadow-sm border-0">
              <TabsTrigger value="facilities" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <Building className="h-4 w-4 mr-2" />
                Facilities
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <Calendar className="h-4 w-4 mr-2" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Facilities Tab */}
            <TabsContent value="facilities">
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-xl font-semibold text-gray-900">Facilities Management</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search facilities..."
                          value={facilityFilter}
                          onChange={(e) => setFacilityFilter(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>
                      <Select value={facilityStatusFilter} onValueChange={setFacilityStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-100">
                          <TableHead className="font-semibold text-gray-900">Facility</TableHead>
                          <TableHead className="font-semibold text-gray-900">Owner</TableHead>
                          <TableHead className="font-semibold text-gray-900">Status</TableHead>
                          <TableHead className="font-semibold text-gray-900">Courts</TableHead>
                          <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFacilities.map((facility) => (
                          <TableRow key={facility.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{facility.name}</p>
                                <p className="text-sm text-gray-500 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {facility.location}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {facility.sports.slice(0, 2).map((sport) => (
                                    <Badge key={sport} variant="secondary" className="text-xs">
                                      {sport}
                                    </Badge>
                                  ))}
                                  {facility.sports.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{facility.sports.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{facility.owner.fullName}</p>
                                <p className="text-sm text-gray-500">{facility.owner.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  facility.status === 'APPROVED' ? 'default' : 
                                  facility.status === 'PENDING' ? 'secondary' : 'destructive'
                                }
                                className={
                                  facility.status === 'APPROVED' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  facility.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                  'bg-red-100 text-red-800 hover:bg-red-100'
                                }
                              >
                                {facility.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-gray-900">{facility._count.courts}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {facility.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => approveFacility(facility.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Approve
                                    </Button>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setSelectedFacility(facility)}
                                          className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Reject
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Reject Facility</DialogTitle>
                                          <DialogDescription>
                                            Please provide a reason for rejecting "{facility.name}". This will be sent to the facility owner.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <Textarea
                                          placeholder="Enter rejection reason..."
                                          value={rejectReason}
                                          onChange={(e) => setRejectReason(e.target.value)}
                                          className="min-h-20"
                                        />
                                        <DialogFooter>
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setRejectReason('');
                                              setSelectedFacility(null);
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            onClick={() => facility && rejectFacility(facility.id, rejectReason)}
                                            disabled={!rejectReason.trim()}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                          >
                                            Reject Facility
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </>
                                )}
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-xl font-semibold text-gray-900">Users Management</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search users..."
                          value={userFilter}
                          onChange={(e) => setUserFilter(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>
                      <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="USER">User</SelectItem>
                          <SelectItem value="OWNER">Owner</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-100">
                          <TableHead className="font-semibold text-gray-900">User</TableHead>
                          <TableHead className="font-semibold text-gray-900">Role</TableHead>
                          <TableHead className="font-semibold text-gray-900">Status</TableHead>
                          <TableHead className="font-semibold text-gray-900">Activity</TableHead>
                          <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{user.fullName}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                <p className="text-xs text-gray-400">
                                  Joined {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  user.role === 'ADMIN' ? 'text-purple-700 border-purple-200 bg-purple-50' :
                                  user.role === 'OWNER' ? 'text-blue-700 border-blue-200 bg-blue-50' :
                                  'text-gray-700 border-gray-200 bg-gray-50'
                                }
                              >
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}
                                className={
                                  user.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                    : 'bg-red-100 text-red-800 hover:bg-red-100'
                                }
                              >
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="text-gray-900">{user._count.bookings} bookings</p>
                                {user.role === 'OWNER' && (
                                  <p className="text-gray-500">{user._count.facilities} facilities</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {user.status === 'ACTIVE' && user.role !== 'ADMIN' ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedUser(user)}
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                      >
                                        <Ban className="h-3 w-3 mr-1" />
                                        Ban
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Ban User</DialogTitle>
                                        <DialogDescription>
                                          Please provide a reason for banning "{user.fullName}". This action will prevent them from accessing the platform.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <Textarea
                                        placeholder="Enter ban reason..."
                                        value={banReason}
                                        onChange={(e) => setBanReason(e.target.value)}
                                        className="min-h-20"
                                      />
                                      <DialogFooter>
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setBanReason('');
                                            setSelectedUser(null);
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() => user && banUser(user.id, banReason)}
                                          disabled={!banReason.trim()}
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          Ban User
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                ) : user.status === 'BANNED' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => unbanUser(user.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Unban
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-xl font-semibold text-gray-900">Bookings Management</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search bookings..."
                          value={bookingFilter}
                          onChange={(e) => setBookingFilter(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>
                      <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gray-100">
                          <TableHead className="font-semibold text-gray-900">Booking</TableHead>
                          <TableHead className="font-semibold text-gray-900">User</TableHead>
                          <TableHead className="font-semibold text-gray-900">Facility</TableHead>
                          <TableHead className="font-semibold text-gray-900">Time</TableHead>
                          <TableHead className="font-semibold text-gray-900">Status</TableHead>
                          <TableHead className="font-semibold text-gray-900">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking) => (
                          <TableRow key={booking.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">#{booking.id.slice(-8)}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(booking.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{booking.user.fullName}</p>
                                <p className="text-sm text-gray-500">{booking.user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{booking.facility.name}</p>
                                <p className="text-sm text-gray-500 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {booking.facility.location}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-gray-400" />
                                <div>
                                  <p className="text-sm text-gray-900">
                                    {new Date(booking.startTime).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  booking.status === 'CONFIRMED' ? 'default' : 
                                  booking.status === 'PENDING' ? 'secondary' : 
                                  booking.status === 'COMPLETED' ? 'default' : 'destructive'
                                }
                                className={
                                  booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                  booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                  booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                  'bg-red-100 text-red-800 hover:bg-red-100'
                                }
                              >
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-gray-900">₹{booking.totalPrice}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-xl font-semibold text-gray-900">Data Analytics</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <AdminAnalytics />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
