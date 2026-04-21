import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  showStrengthMeter?: boolean;
  disabled?: boolean;
  required?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  showStrengthMeter = false,
  disabled = false,
  required = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength(value);
  
  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-gray-700 font-medium">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-12 h-12 border-gray-200 focus:border-[#2ECC71] focus:ring-[#2ECC71] transition-colors"
          required={required}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Password Strength Meter */}
      {showStrengthMeter && value && (
        <div className="mt-2">
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${
              passwordStrength <= 2 ? 'text-red-500' : 
              passwordStrength <= 3 ? 'text-yellow-500' : 
              'text-green-500'
            }`}>
              {getStrengthText()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
