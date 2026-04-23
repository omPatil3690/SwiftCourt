import { Toaster } from "./client/components/ui/toaster";
import { Toaster as Sonner } from "./client/components/ui/sonner";
import { TooltipProvider } from "./client/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import React from 'react';

// Contexts
import { AuthProvider } from "./client/contexts/AuthContext";
import { ThemeProvider } from "./client/contexts/ThemeContext";

// Components
import Footer from "./client/components/Footer";
import ProtectedRoute from "./client/components/ProtectedRoute";

// Pages
import Index from "./client/pages/Index";
import NotFound from "./client/pages/NotFound";
import Venues from "./client/pages/Venues";
import VenuesPage from "./client/pages/VenuesPage";
import VenueDetailsPage from "./client/pages/VenueDetailsPage";
import Login from "./client/pages/Login";
import Signup from "./client/pages/Signup";
import OtpLogin from "./client/pages/OtpLogin";
// If the file is named differently, update the import path accordingly, e.g.:
// import Login from "./pages/LoginPage";
// import Login from "./pages/login";
// import Signup from "./pages/Signup";
import ForgotPassword from "./client/pages/ForgotPassword";
import ResetPassword from "./client/pages/ResetPassword";
import Profile from "./client/pages/Profile";
import MyBookings from "./client/pages/MyBookings";
import BookingPageNew from "./client/pages/BookingPageNew";
import AdminDashboard from "./client/pages/AdminDashboard";
import OwnerDashboard from "./client/pages/OwnerDashboard";
import AdminSignup from "./client/pages/AdminSignup";
import About from "./client/pages/About";

const queryClient = new QueryClient();

// Component to conditionally render footer
const ConditionalFooter = () => {
  const location = useLocation();
  
  // Pages where footer should NOT be shown
  const authPages = [
    '/login',
    '/signup', 
    '/otp-login',
    '/forgot-password',
    '/reset-password',
    '/admin/signup'
  ];
  
  // Don't show footer on auth pages
  if (authPages.includes(location.pathname)) {
    return null;
  }
  
  return <Footer />;
};

const AppContent = () => (
  <div className="min-h-screen flex flex-col">
    <div className="flex-1">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/play" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <VenuesPage />
          </ProtectedRoute>
        } />
        <Route path="/book" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <VenuesPage />
          </ProtectedRoute>
        } />
        <Route path="/train" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <VenuesPage />
          </ProtectedRoute>
        } />
        <Route path="/venues" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <Venues />
          </ProtectedRoute>
        } />
        <Route path="/venues-search" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <VenuesPage />
          </ProtectedRoute>
        } />
        <Route path="/venue/:id" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <VenueDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/venues/:id" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <VenueDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/venue-details/:id" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <VenueDetailsPage />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/otp-login" element={<OtpLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        
        {/* Protected Routes */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['USER', 'OWNER', 'ADMIN']}>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/my-bookings" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <MyBookings />
          </ProtectedRoute>
        } />
        <Route path="/book/:venueId/:courtId" element={
          <ProtectedRoute allowedRoles={['USER', 'ADMIN']}>
            <BookingPageNew />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Owner Routes */}
        <Route path="/owner" element={
          <ProtectedRoute requiredRole="OWNER">
            <Navigate to="/owner/dashboard" replace />
          </ProtectedRoute>
        } />
        <Route path="/owner/dashboard" element={
          <ProtectedRoute requiredRole="OWNER">
            <OwnerDashboard />
          </ProtectedRoute>
        } />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
    <ConditionalFooter />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;

// Lightweight Error Boundary (logs to console; can integrate Sentry.captureException later)
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, info: any) {
    console.error('UI ErrorBoundary caught error', error, info);
    // TODO: send to monitoring service
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="mb-4 text-sm text-muted-foreground">The interface crashed. You can try reloading the page.</p>
          <button className="px-4 py-2 bg-black text-white rounded" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
