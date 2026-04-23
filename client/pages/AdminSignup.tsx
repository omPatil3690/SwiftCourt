import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, User, Mail, Lock, Camera, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import OtpVerification from '../components/OtpVerification';

// Dedicated Admin Signup page (role fixed to ADMIN)
const AdminSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [inviteSecret, setInviteSecret] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null); // reserved for future avatar upload integration
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Password strength helpers (mirrors main signup page)
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };
  const passwordStrength = getPasswordStrength(password);
  const strengthColor = passwordStrength <= 2 ? 'bg-red-500' : passwordStrength <= 3 ? 'bg-yellow-500' : 'bg-green-500';
  const strengthText = passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('File size must be < 2MB'); return; }
    if (!file.type.startsWith('image/')) { alert('Please select an image'); return; }
    setAvatar(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;
    if (password !== confirmPassword) return;
    if (password.length < 8) return;
    setIsLoading(true);
    try {
  const result = await signup({ email, password, fullName, role: 'ADMIN', inviteSecret });
      setUserId(result.userId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerified = () => {
    navigate('/login?role=admin', { state: { message: 'Admin account verified. Please login.' } });
  };

  if (userId) {
    return (
      <>
        <SEO title="Verify Admin Email - QuickCourt" description="Verify your admin email" path="/admin/signup" />
        <OtpVerification userId={userId} email={email} userRole="ADMIN" isLoginFlow={false} onVerified={handleOtpVerified} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SEO title="Admin Sign Up - QuickCourt" description="Create an administrator account" path="/admin/signup" />
      {/* Left side banner */}
      <motion.div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?auto=format&fit=crop&w=2340&q=80')" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700/80 to-purple-900/90" />
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <div className="text-center text-white">
            <motion.h1 className="text-4xl font-bold mb-4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
              Admin Control
            </motion.h1>
            <motion.p className="text-xl opacity-90" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>
              Securely manage venues, users & platform data
            </motion.p>
          </div>
        </div>
      </motion.div>
      {/* Form section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-4 sm:mb-6 lg:hidden">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>
          <motion.div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            <div className="text-center mb-6 sm:mb-8">
              <motion.div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mb-4 sm:mb-6 shadow-lg" whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400 }}>
                <Shield className="h-7 w-7 text-white" />
              </motion.div>
              <span className="inline-flex items-center px-3 py-1 mb-4 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Administrator Registration</span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Create Admin Account</h1>
              <p className="text-gray-500 text-sm sm:text-base">This account will have elevated permissions. Keep credentials secure.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-3 border-gray-300 bg-gray-100 flex items-center justify-center cursor-pointer hover:border-purple-500 transition-colors overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                    {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover rounded-full" /> : <User className="h-8 w-8 text-gray-400" />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1.5 cursor-pointer hover:bg-purple-700 transition-colors" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-3 w-3 text-white" />
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                  <Input id="fullName" type="text" placeholder="Enter full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12 border-gray-200 focus:border-purple-600 focus:ring-purple-600 transition-colors" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400" /></div>
                  <Input id="email" type="email" placeholder="Enter admin email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 border-gray-200 focus:border-purple-600 focus:ring-purple-600 transition-colors" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteSecret" className="text-gray-700 font-medium flex items-center justify-between">Admin Invite Secret <span className="text-xs text-gray-400 font-normal">Required</span></Label>
                <Input id="inviteSecret" type="password" placeholder="Enter provided secret" value={inviteSecret} onChange={(e) => setInviteSecret(e.target.value)} className="h-12 border-gray-200 focus:border-purple-600 focus:ring-purple-600 transition-colors" required />
              </div>
              <input type="hidden" name="role" value="ADMIN" />
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-12 h-12 border-gray-200 focus:border-purple-600 focus:ring-purple-600 transition-colors" required />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </Button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-300 ${strengthColor}`} style={{ width: `${(passwordStrength / 5) * 100}%` }} /></div>
                      <span className={`text-xs font-medium ${passwordStrength <= 2 ? 'text-red-500' : passwordStrength <= 3 ? 'text-yellow-500' : 'text-green-500'}`}>{strengthText}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                  <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 pr-12 h-12 border-gray-200 focus:border-purple-600 focus:ring-purple-600 transition-colors" required />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </Button>
                </div>
                {password !== confirmPassword && confirmPassword && <p className="text-sm text-red-500 mt-1">Passwords don't match</p>}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200" disabled={isLoading || password !== confirmPassword || password.length < 8 || !inviteSecret}>
                  {isLoading ? 'Creating admin...' : 'Create Admin Account'}
                </Button>
              </motion.div>
              <p className="text-xs text-gray-400 leading-relaxed">
                By creating an administrator account you acknowledge responsibility for safeguarding platform data and agree to follow internal security policies.
              </p>
            </form>
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                Need regular account?{' '}
                <Link to="/signup" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">User / Owner Signup</Link>
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Already an admin?{' '}
                <Link to="/login?role=admin" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors">Admin Login</Link>
              </p>
            </div>
          </motion.div>
          <div className="hidden lg:block mt-6 text-center">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Footer intentionally self-contained; global Footer suppressed via authPages list.

export default AdminSignup;
