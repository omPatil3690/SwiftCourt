import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

type Range = '7d' | '30d' | '90d' | '12m';

interface AnalyticsResponse {
  range: Range;
  granularity: 'day' | 'month';
  users: {
    total: number;
    byRole: { USER: number; OWNER: number; ADMIN: number };
    timeSeries: { period: string; total: number; USER: number; OWNER: number }[];
  };
  bookings: {
    total: number;
    byStatus: { PENDING: number; CONFIRMED: number; COMPLETED: number; CANCELLED: number };
    timeSeries: { period: string; total: number; PENDING: number; CONFIRMED: number; COMPLETED: number; CANCELLED: number }[];
  };
  revenue: {
    total: number;
    timeSeries: { period: string; amount: number }[];
  };
  facilities: {
    total: number;
    byStatus: Record<string, number>;
  };
  topFacilities: { id: string; name: string; revenue: number; bookings: number }[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>('30d');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get<AnalyticsResponse>(`/admin/analytics?range=${range}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range]);

  const facilityStatusSeries = useMemo(() => {
    if (!data) return [] as { name: string; value: number }[];
    return Object.entries(data.facilities.byStatus).map(([name, value]) => ({ name, value: Number(value) }));
  }, [data]);

  const currency = (n: number) => `₹${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Platform Analytics</h2>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs">Granularity: {data?.granularity || 'day'}</Badge>
          <Select value={range} onValueChange={(v: Range) => setRange(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">Loading analytics…</div>
      ) : data ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Users</p>
                <p className="text-2xl font-bold text-gray-900">{data.users.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Owners: {data.users.byRole.OWNER.toLocaleString()} • Users: {data.users.byRole.USER.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{data.bookings.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Confirmed: {data.bookings.byStatus.CONFIRMED.toLocaleString()} • Completed: {data.bookings.byStatus.COMPLETED.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{currency(data.revenue.total)}</p>
                <p className="text-xs text-gray-500">From confirmed and completed bookings</p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">Facilities</p>
                <p className="text-2xl font-bold text-gray-900">{data.facilities.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Status: {facilityStatusSeries.map(s=>`${s.name}:${s.value}`).join(' • ') || '—'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-gray-900">Users growth</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.users.timeSeries} margin={{ left: 10, right: 10 }}>
                    <defs>
                      <linearGradient id="u1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="url(#u1)" name="Total" />
                    <Line type="monotone" dataKey="OWNER" stroke="#10B981" dot={false} name="Owners" />
                    <Line type="monotone" dataKey="USER" stroke="#6B7280" dot={false} name="Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-gray-900">Bookings by status</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.bookings.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="PENDING" stackId="a" fill="#F59E0B" name="Pending" />
                    <Bar dataKey="CONFIRMED" stackId="a" fill="#3B82F6" name="Confirmed" />
                    <Bar dataKey="COMPLETED" stackId="a" fill="#10B981" name="Completed" />
                    <Bar dataKey="CANCELLED" stackId="a" fill="#EF4444" name="Cancelled" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-gray-900">Revenue</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenue.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v)=>`₹${v}`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v)=>currency(Number(v))} />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#10B981" dot={false} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-gray-900">Facilities status</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie data={facilityStatusSeries} dataKey="value" nameKey="name" outerRadius={90} label>
                      {facilityStatusSeries.map((entry, index) => (
                        <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-0 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-gray-900">Top facilities by revenue</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topFacilities} margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v)=>`₹${v}`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v)=>currency(Number(v))} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#10B981" />
                    <Bar dataKey="bookings" name="Bookings" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">No analytics available.</div>
      )}
    </div>
  );
}
