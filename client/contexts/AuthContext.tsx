import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, authApi } from '../lib/api';
import { useToast } from '../hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'USER' | 'OWNER' | 'ADMIN';
  inviteSecret?: string;
  }) => Promise<{ userId: string }>;
  verifyOtp: (userId: string, otp: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      // Decode JWT to get user data (simple decode, not verification)
      const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
      const userData: User = {
        id: payload.sub,
        role: payload.role,
        email,
        fullName: '', // We don't have this from the token, would need a separate API call
        status: 'ACTIVE'
      };
      
      setUser(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'Please check your credentials.',
      });
      throw error;
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    fullName: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
  inviteSecret?: string;
  }) => {
    try {
      const response = await authApi.signup(data) as { userId: string };
      
      toast({
        title: 'Account created!',
        description: 'Please check your email for the verification code.',
      });
      
      return response;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error.message || 'Please try again.',
      });
      throw error;
    }
  };

  const verifyOtp = async (userId: string, otp: string) => {
    try {
      await authApi.verifyOtp({ userId, otp });
      
      toast({
        title: 'Email verified!',
        description: 'Your account has been successfully verified.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message || 'Please check your verification code.',
      });
      throw error;
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      // Fire and forget logout API call
      authApi.logout(refreshToken).catch(() => {
        // Ignore errors during logout
      });
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setUser(null);
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    verifyOtp,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
