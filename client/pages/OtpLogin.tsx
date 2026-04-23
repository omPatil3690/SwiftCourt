import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/button';
import SEO from '../components/SEO';

const OtpLogin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SEO
        title="OTP Login Unavailable - SwiftCourt"
        description="OTP login is not configured in this build."
        path="/otp-login"
      />

      <motion.div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <ShieldAlert className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">OTP login is not enabled</h1>
        <p className="mb-6 text-sm text-gray-600">
          This project currently supports password-based authentication only. Use your
          email and password to sign in.
        </p>
        <div className="space-y-3">
          <Button
            className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-white"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
          <Button variant="ghost" className="w-full h-12" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default OtpLogin;
