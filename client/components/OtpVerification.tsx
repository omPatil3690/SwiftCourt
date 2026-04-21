import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, Clock, Edit3, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface OtpVerificationProps {
  userId: string;
  email?: string;
  userRole?: 'USER' | 'OWNER' | 'ADMIN';
  isLoginFlow?: boolean;
  onVerified: () => void;
}

const OtpVerification = ({ 
  userId, 
  email = '', 
  userRole = 'USER',
  isLoginFlow = false,
  onVerified 
}: OtpVerificationProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const { verifyOtp } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const maskEmail = (email: string) => {
    if (!email) return 'your email';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = localPart.charAt(0) + '*'.repeat(Math.max(0, localPart.length - 2)) + localPart.slice(-1);
    return `${maskedLocal}@${domain}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length > 1) {
      // Handle paste - distribute across inputs
      const pastedOtp = numericValue.slice(0, 6).split('');
      const newOtp = [...otp];
      
      for (let i = 0; i < pastedOtp.length && index + i < 6; i++) {
        newOtp[index + i] = pastedOtp[i];
      }
      
      setOtp(newOtp);
      
      // Focus the next empty input or last filled one
      const nextIndex = Math.min(index + pastedOtp.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter all 6 digits",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(userId, otpString);
      
      toast({
        title: "Email Verified!",
        description: "Your account has been successfully verified.",
      });

      // Navigate based on flow and role
      if (isLoginFlow) {
        onVerified();
      } else {
        // Signup flow - redirect based on role
        setTimeout(() => {
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
        }, 1000);
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Invalid OTP. Please try again.",
        variant: "destructive",
      });
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      
      toast({
        title: "OTP Sent!",
        description: "A new verification code has been sent to your email.",
      });

      // Reset countdown
      setCountdown(30);
      setCanResend(false);
      
      // Clear current OTP
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast({
        title: "Failed to resend",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleEditEmail = () => {
    navigate('/signup');
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">QC</span>
          </div>
          <h1 className="text-gray-600 font-medium">QuickCourt</h1>
        </motion.div>

        {/* OTP Card */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-8 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-[#2ECC71]" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Verify Your Account
            </h2>
            <p className="text-gray-500 mb-2">
              Enter the 6-digit code sent to your email
            </p>
            <p className="text-sm text-gray-600 font-medium">
              {maskEmail(email)}
            </p>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Boxes */}
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                >
                  <input
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`
                      w-12 h-12 text-center text-xl font-bold
                      border-2 rounded-lg bg-white
                      transition-all duration-200 ease-in-out
                      focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-[#2ECC71]
                      ${digit ? 'border-[#2ECC71] bg-green-50' : 'border-gray-300'}
                      hover:border-gray-400
                    `}
                    placeholder="0"
                  />
                </motion.div>
              ))}
            </div>

            {/* Verify Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !isOtpComplete}
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.span
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2"
                    >
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="verify"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>Verify & Continue</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </form>

          {/* Secondary Actions */}
          <div className="mt-8 space-y-4">
            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">
                Didn't receive the code?
              </p>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={!canResend || isResending}
                  className="text-[#2ECC71] hover:text-[#27AE60] hover:bg-green-50 font-semibold disabled:text-gray-400"
                >
                  {isResending ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </span>
                  ) : canResend ? (
                    'Resend OTP'
                  ) : (
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Resend in {countdown}s</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Edit Email */}
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleEditEmail}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit Email Address
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default OtpVerification;
