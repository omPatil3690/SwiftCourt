// Resolve API base dynamically: Vercel / Netlify etc. can inject VITE_API_BASE_URL
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://quick-court-hlmu.vercel.app';

// API utility functions
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  // Debug: log the request URL
  if (endpoint.startsWith('/auth/login')) {
    // eslint-disable-next-line no-console
    console.log('[API] Login request URL:', fullUrl);
  }
  const response = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // If token is expired, try to refresh it
    if (response.status === 401 && token) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await authApi.refresh(refreshToken);
          localStorage.setItem('accessToken', refreshResponse.accessToken);
          localStorage.setItem('refreshToken', refreshResponse.refreshToken);
          
          // Retry the original request with new token
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${refreshResponse.accessToken}`,
              ...options.headers,
            },
            ...options,
          });
          
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    
    let errorMsg = 'Request failed';
    try {
      const error = await response.json();
      errorMsg = error.message || errorMsg;
    } catch (e) {
      errorMsg = 'Network error';
    }
    // Debug: log error details
    if (endpoint.startsWith('/auth/login')) {
      // eslint-disable-next-line no-console
      console.error('[API] Login error:', response.status, errorMsg);
    }
    throw new ApiError(response.status, errorMsg);
  }

  return response.json();
}

// Auth API
export const authApi = {
  signup: (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'USER' | 'OWNER' | 'ADMIN';
    avatarUrl?: string;
  inviteSecret?: string;
  }) => apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  verifyOtp: (data: { userId: string; otp: string }) =>
    apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refresh: (refreshToken: string) =>
    apiRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string) =>
    apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// Loyalty & Rewards API
export const loyaltyApi = {
  me: () => apiRequest<{ loyaltyPoints: number; currentStreak: number }>(`/loyalty/me`),
  ledger: () => apiRequest<Array<{ id: string; userId: string; delta: number; balanceAfter: number; source: string; meta: any; createdAt: string }>>(`/loyalty/ledger`),
  ensureReferralCode: () => apiRequest<{ code: string }>(`/loyalty/referral/code`),
  applyReferral: (code: string) => apiRequest<{ success: true }>(`/loyalty/referral/apply`, { method: 'POST', body: JSON.stringify({ code }) })
};

export interface BadgeEarned {
  id: string; code: string; name: string; description: string; earnedAt: string;
}

export const badgeApi = {
  mine: () => apiRequest<BadgeEarned[]>(`/badges/me`),
  list: () => apiRequest<Array<{ id: string; code: string; name: string; description: string }>>(`/badges`)
};

// Facilities API
export const facilitiesApi = {
  list: (params?: {
    sport?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.sport) searchParams.set('sport', params.sport);
    if (params?.q) searchParams.set('q', params.q);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    
    return apiRequest<{
      items: Facility[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/facilities?${searchParams}`);
  },

  getById: (id: string) => apiRequest<Facility>(`/facilities/${id}`),

  create: (data: {
    name: string;
    location: string;
    description: string;
    sports: string[];
    amenities?: string[];
    images?: string[];
    // Optional geo
    latitude?: number;
    longitude?: number;
  propertyTypes?: ("PLAY" | "BOOK" | "TRAIN")[];
  }) => apiRequest('/facilities', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getAvailability: (facilityId: string, date: string) => apiRequest<{
    id: string;
    startTime: string;
    endTime: string;
    price: number;
    isAvailable: boolean;
    courtId: string;
    courtName: string;
  }[]>(`/facilities/${facilityId}/availability?date=${encodeURIComponent(date)}`),
};

// Courts API
export const courtsApi = {
  create: (data: {
    name: string;
    facilityId: string;
    pricePerHour: number;
    openTime: number;
    closeTime: number;
  }) => apiRequest('/courts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getByFacility: (facilityId: string) => apiRequest<Court[]>(`/courts/facility/${facilityId}`),

  getOwnerCourts: () => apiRequest<(Court & {
    facility: {
      name: string;
      location: string;
      status: string;
    };
    _count: {
      bookings: number;
    };
  })[]>('/courts/owner'),

  getById: (id: string) => apiRequest<Court & {
    facility: {
      name: string;
      location: string;
      status: string;
      sports: string[];
      amenities: string[];
    };
  }>(`/courts/${id}`),

  update: (id: string, data: {
    name?: string;
    pricePerHour?: number;
    openTime?: number;
    closeTime?: number;
  }) => apiRequest(`/courts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: string) => apiRequest(`/courts/${id}`, {
    method: 'DELETE',
  }),
};

// Bookings API
export const bookingsApi = {
  create: (data: { courtId: string; startTime: string; endTime: string; }) =>
    apiRequest<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) }),

  cancel: (id: string) => apiRequest<Booking>(`/bookings/${id}/cancel`, { method: 'PUT' }),

  delete: (id: string) => apiRequest<{ success: true }>(`/bookings/${id}`, { method: 'DELETE' }),

  getMy: () => apiRequest<Booking[]>('/bookings/my'),

  getOwnerStats: () => apiRequest<{ totalBookings: number; payments: { succeeded: number; refunded: number; net: number } }>(
    '/bookings/owner/stats'
  ),
};

// Types
export interface Facility {
  id: string;
  name: string;
  location: string;
  description: string;
  sports: string[];
  amenities: string[];
  images: string[];
  propertyTypes?: ("PLAY" | "BOOK" | "TRAIN")[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  ownerId: string;
  courts: Court[];
  createdAt: string;
  updatedAt: string;
}

export interface Court {
  id: string;
  name: string;
  facilityId: string;
  pricePerHour: number;
  openTime: number;
  closeTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  courtId: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  price: number;
  createdAt: string;
  updatedAt: string;
  court: Court & { facility: Facility };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED';
}

// API instance with common HTTP methods
export const api = {
  get: async <T>(endpoint: string): Promise<{ data: T }> => {
    const response = await apiRequest<T>(endpoint, { method: 'GET' });
    return { data: response };
  },
  
  post: async <T>(endpoint: string, data?: any): Promise<{ data: T }> => {
    const response = await apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: response };
  },
  
  put: async <T>(endpoint: string, data?: any): Promise<{ data: T }> => {
    const response = await apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: response };
  },
  
  delete: async <T>(endpoint: string): Promise<{ data: T }> => {
    const response = await apiRequest<T>(endpoint, { method: 'DELETE' });
    return { data: response };
  },
};
