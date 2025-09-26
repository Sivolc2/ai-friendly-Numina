import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useData } from '../hooks/useData';
import { supabase } from '../lib/supabase';

interface EnhancedSignupProps {
  onBack?: () => void;
}

export const EnhancedSignup: React.FC<EnhancedSignupProps> = ({ onBack }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invitationToken = searchParams.get('token');
  
  const [mode, setMode] = useState<'organiser' | 'invitation'>(invitationToken ? 'invitation' : 'organiser');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Invitation validation state
  const [invitationData, setInvitationData] = useState<{
    email: string;
    role: string;
    inviterName: string;
    organizationName?: string;
  } | null>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const { validateInvitationToken, acceptInvitation } = useData();

  // Validate invitation token on component mount
  useEffect(() => {
    if (invitationToken) {
      validateToken();
    }
  }, [invitationToken]);

  const validateToken = async () => {
    if (!invitationToken) return;
    
    setValidatingToken(true);
    setTokenError('');
    
    try {
      const result = await validateInvitationToken(invitationToken);
      
      if (result.valid && result.invitation) {
        setInvitationData(result.invitation);
        setFormData(prev => ({
          ...prev,
          email: result.invitation!.email
        }));
      } else {
        setTokenError(result.error || 'Invalid invitation token');
      }
    } catch (error) {
      setTokenError('Failed to validate invitation');
    } finally {
      setValidatingToken(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (mode === 'organiser' && !formData.organizationName.trim()) {
      setError('Organization name is required');
      return false;
    }
    
    return true;
  };

  const handleOrganiserSignup = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: 'organiser',
            organization_name: formData.organizationName
          }
        }
      });

      if (error) throw error;

      setSuccess('Account created successfully! Please check your email to verify your account.');
      
      // Redirect to signin after a delay
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
      
    } catch (error: any) {
      throw error;
    }
  };

  const handleInvitationSignup = async () => {
    if (!invitationToken) throw new Error('No invitation token found');
    
    try {
      await acceptInvitation(invitationToken, {
        name: formData.name,
        password: formData.password,
        organizationName: formData.organizationName
      });

      setSuccess('Account created successfully! You can now sign in.');
      
      // Redirect to signin after a delay
      setTimeout(() => {
        navigate('/signin');
      }, 3000);
      
    } catch (error: any) {
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (mode === 'invitation') {
        await handleInvitationSignup();
      } else {
        await handleOrganiserSignup();
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  // Show token validation loading
  if (invitationToken && validatingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Validating Invitation</h2>
            <p className="text-gray-600">Please wait while we verify your invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show token error
  if (invitationToken && tokenError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Invalid Invitation</h2>
            <p className="text-gray-600 mb-4">{tokenError}</p>
            <button
              onClick={() => navigate('/signin')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          )}
          
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              {mode === 'invitation' ? (
                <Mail className="h-8 w-8 text-purple-600" />
              ) : (
                <Building className="h-8 w-8 text-purple-600" />
              )}
            </div>
          </div>
          
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            {mode === 'invitation' 
              ? 'Accept Invitation' 
              : 'Create Organization Account'
            }
          </h2>
          
          {mode === 'invitation' && invitationData && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>{invitationData.inviterName}</strong> invited you to join 
                {invitationData.organizationName && <> <strong>{invitationData.organizationName}</strong></>} 
                as a <strong>{invitationData.role}</strong>
              </p>
            </div>
          )}
          
          <p className="mt-2 text-gray-600">
            {mode === 'invitation' 
              ? 'Complete your registration to accept the invitation'
              : 'Start managing your photography events and team'
            }
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Signup Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={mode === 'invitation'}
                  className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your email address"
                />
              </div>
              {mode === 'invitation' && (
                <p className="text-xs text-gray-500 mt-1">Email provided by invitation</p>
              )}
            </div>

            {/* Organization Name (only for organiser mode) */}
            {mode === 'organiser' && (
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border border-gray-300 rounded-lg py-3 px-4 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your organization name"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 block w-full border border-gray-300 rounded-lg py-3 px-4 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 block w-full border border-gray-300 rounded-lg py-3 px-4 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {mode === 'invitation' ? 'Accepting Invitation...' : 'Creating Account...'}
              </div>
            ) : (
              mode === 'invitation' ? 'Accept Invitation' : 'Create Account'
            )}
          </button>

          {/* Footer Links */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};