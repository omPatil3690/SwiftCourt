import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, CheckCircle, Key } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';
import { api } from '../lib/api';
import SEO from '../components/SEO';
import PasswordInput from '../components/PasswordInput';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get reset token from URL parameters
  const resetToken = searchParams.get('token');

  useEffect(() => {
    // Redirect to forgot password if no token
    if (!resetToken) {
      navigate('/forgot-password');
    }
  }, [resetToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "All fields required",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { 
        token: resetToken, 
        newPassword 
      });
      
      setIsSuccess(true);
      toast({
        title: "Password updated successfully!",
        description: "You can now login with your new password.",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Failed to reset password",
        description: error.response?.data?.message || "Please try again or request a new reset link.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <SEO title="Password Reset Successful - QuickCourt" description="Your password has been reset successfully" path="/reset-password" />
        
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Success Card */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-8 w-full text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {/* Success Icon */}
            <motion.div 
              className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="h-10 w-10 text-[#2ECC71]" />
            </motion.div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Password Reset Successful!
            </h1>
            <p className="text-gray-500 mb-8">
              Your password has been updated successfully. You can now login with your new password.
            </p>

            {/* Auto-redirect message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-700">
                Redirecting to login page in 3 seconds...
              </p>
            </div>

            {/* Manual redirect button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Go to Login
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SEO title="Reset Password - QuickCourt" description="Create a new password for your account" path="/reset-password" />
      
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

        {/* Reset Password Card */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-8 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Reset Your Password
            </h2>
            <p className="text-gray-500">
              Enter a new password for your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Input */}
            <PasswordInput
              id="newPassword"
              label="New Password"
              placeholder="Create a strong password"
              value={newPassword}
              onChange={setNewPassword}
              showStrengthMeter={true}
              disabled={isLoading}
              required={true}
            />

            {/* Confirm Password Input */}
            <PasswordInput
              id="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={isLoading}
              required={true}
            />

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className="mt-2">
                {newPassword === confirmPassword ? (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Passwords match
                  </p>
                ) : (
                  <p className="text-sm text-red-500 flex items-center">
                    <span className="w-4 h-4 mr-1">✕</span>
                    Passwords don't match
                  </p>
                )}
              </div>
            )}

            {/* Update Password Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
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
                      <span>Updating Password...</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="update"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2"
                    >
                      <Key className="h-5 w-5" />
                      <span>Update Password</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </form>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center space-x-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
