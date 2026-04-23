import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from '../hooks/use-toast';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { api } from '../lib/api';
import SEO from '../components/SEO';
import OtpVerification from '../components/OtpVerification';

const OtpLogin = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'USER' | 'OWNER' | 'ADMIN'>('USER');
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/send-login-otp', { email });
      
      setUserId((response.data as any).userId);
      setUserRole((response.data as any).userRole || 'USER');
      
      toast({
        title: "OTP Sent!",
        description: "A verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.response?.data?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerified = () => {
    // Redirect based on role after OTP verification
    switch (userRole) {
      case 'OWNER':
        navigate('/owner/dashboard');
        break;
      case 'ADMIN':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  if (userId) {
    return (
      <>
        <SEO title="Verify Login OTP - QuickCourt" description="Verify your login OTP" path="/otp-login" />
        <OtpVerification 
          userId={userId} 
          email={email}
          userRole={userRole}
          isLoginFlow={true}
          onVerified={handleOtpVerified} 
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SEO title="Login with OTP - QuickCourt" description="Login to your QuickCourt account using OTP" path="/otp-login" />
      
      {/* Left Column - Background Image (Desktop Only) */}
      <motion.div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2ECC71]/80 to-[#27AE60]/90" />
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <div className="text-center text-white">
            <motion.h1 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Secure Login
            </motion.h1>
            <motion.p 
              className="text-xl opacity-90"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Login securely with OTP sent to your email
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Right Column - OTP Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back Button - Mobile */}
          <div className="mb-6 lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>

          {/* OTP Login Card */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-8 w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              {/* Logo */}
              <motion.div 
                className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center mb-6 shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="text-white font-bold text-2xl">QC</span>
              </motion.div>

              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Login with OTP
              </h1>
              <p className="text-gray-500">
                Enter your email to receive a secure login code
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSendOtp} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-[#2ECC71] focus:ring-[#2ECC71] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Send OTP Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending OTP...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <Send className="h-5 w-5" />
                      <span>Send Login Code</span>
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Remember your password?{' '}
                <button 
                  onClick={() => navigate('/login')}
                  className="text-[#2ECC71] hover:text-[#27AE60] font-semibold transition-colors"
                >
                  Login with Password
                </button>
              </p>
            </div>
          </motion.div>

          {/* Back Button - Desktop */}
          <div className="hidden lg:block mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OtpLogin;
