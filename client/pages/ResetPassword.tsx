import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import SEO from '../components/SEO';

const ResetPassword = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SEO
        title="Reset Password Unavailable - SwiftCourt"
        description="Password reset tokens are not configured in this backend yet."
        path="/reset-password"
      />

      <motion.div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
          <KeyRound className="h-8 w-8 text-purple-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">No reset flow is configured</h1>
        <p className="mb-6 text-sm text-gray-600">
          This page needs a backend-issued reset token flow, which is not implemented in the
          current server. Use an existing password or create a new account for now.
        </p>
        <div className="space-y-3">
          <Button
            className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-white"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </Button>
          <Button variant="ghost" className="w-full h-12" onClick={() => navigate('/forgot-password')}>
            Go to Password Help
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

export default ResetPassword;
