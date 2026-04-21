import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'OWNER' | 'ADMIN';
  allowedRoles?: ('USER' | 'OWNER' | 'ADMIN')[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user.role !== requiredRole) {
    // Redirect based on user's actual role
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      case 'OWNER':
        return <Navigate to="/owner/dashboard" replace />;
      case 'USER':
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Check if user role is in allowed roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on user's actual role
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      case 'OWNER':
        return <Navigate to="/owner/dashboard" replace />;
      case 'USER':
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Check if user is banned
  if (user.status === 'BANNED') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="text-red-600 text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been suspended. Please contact support for assistance.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
