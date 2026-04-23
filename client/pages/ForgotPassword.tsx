import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MailWarning } from 'lucide-react';
import { Button } from '../components/ui/button';
import SEO from '../components/SEO';

const ForgotPassword = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SEO
        title="Password Reset Unavailable - SwiftCourt"
        description="Password reset is not configured in this backend yet."
        path="/forgot-password"
      />

      <motion.div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <MailWarning className="h-8 w-8 text-blue-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Password reset isn&apos;t set up yet</h1>
        <p className="mb-6 text-sm text-gray-600">
          The current backend does not expose forgot-password or reset-password endpoints,
          so this screen is informational for now.
        </p>
        <div className="space-y-3">
          <Button
            className="w-full h-12 bg-[#2ECC71] hover:bg-[#27AE60] text-white"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </Button>
          <Link to="/signup" className="block">
            <Button variant="ghost" className="w-full h-12">
              Create a New Account
            </Button>
          </Link>
          <Button variant="ghost" className="w-full h-12" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
