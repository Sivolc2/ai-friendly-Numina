import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Mail, Lock, User, Camera, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onOpenFeedback?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin', onOpenFeedback }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic-link' | 'forgot-password' | 'detecting'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [userRoleInfo, setUserRoleInfo] = useState<{ 
    isRegistered: boolean; 
    isAdmin: boolean; 
    isPhotographer: boolean; 
    prefersMagicLink: boolean;
    suggestFeedbackForm: boolean;
    errorType?: 'server_error' | 'not_found' | null;
  } | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { signIn, signUp, signInWithMagicLink, checkUserRole } = useAuth();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Debounced role checking function
  const debouncedRoleCheck = useCallback(async (email: string) => {
    if (!isValidEmail(email)) {
      return;
    }

    console.log('DEBUG: Starting role check for:', email);
    
    // Special handling for super admin emails
    const superAdminEmails = ['derrick@derricksiu.com', 'accounts@derricksiu.com'];
    if (superAdminEmails.includes(email.toLowerCase())) {
      console.log('DEBUG: Super admin email detected, allowing access:', email);
      setUserRoleInfo({
        isRegistered: true,
        isAdmin: true,
        isPhotographer: true,
        prefersMagicLink: false,
        suggestFeedbackForm: false,
        errorType: null
      });
      setEmailChecked(true);
      setIsCheckingRole(false);
      return;
    }
    
    setIsCheckingRole(true);
    setEmailChecked(false);
    
    try {
      const roleInfo = await checkUserRole(email);
      setUserRoleInfo(roleInfo);
      setEmailChecked(true);
      setIsCheckingRole(false);
      
      // DEV MODE: Allow password login for test accounts on localhost
      const isDevelopment = window.location.hostname === 'localhost';
      const isTestEmail = email.includes('test') || email.includes('demo');
      
      if (isDevelopment && isTestEmail) {
        console.log('DEBUG: Dev mode - allowing password login for test account:', email);
        setMode('signin');
        setUserRoleInfo({
          ...roleInfo,
          prefersMagicLink: false, // Force password mode for test accounts in dev
          isRegistered: true // Allow password even if not registered
        });
        return;
      }
      
      // Handle different scenarios based on registration status
      if (roleInfo.errorType === 'server_error') {
        // Keep current mode, show error message
        console.log('DEBUG: Server error detected, keeping current mode');
      } else if (roleInfo.errorType === 'not_found' && !roleInfo.isRegistered) {
        // Unregistered user - don't switch modes automatically
        console.log('DEBUG: Unregistered user detected:', { email, suggestFeedbackForm: roleInfo.suggestFeedbackForm });
      } else if (roleInfo.isRegistered) {
        // Registered user - auto-switch based on preference
        if (roleInfo.prefersMagicLink) {
          setMode('magic-link');
        } else {
          setMode('signin');
        }
        console.log('DEBUG: Auto-selected mode for registered user:', { 
          email, 
          roleInfo, 
          selectedMode: roleInfo.prefersMagicLink ? 'magic-link' : 'signin' 
        });
      }
    } catch (err) {
      console.error('DEBUG: Exception in role check:', err);
      setEmailChecked(true);
      setIsCheckingRole(false);
      // Set error state
      setUserRoleInfo({ 
        isRegistered: false,
        isAdmin: false, 
        isPhotographer: false, 
        prefersMagicLink: true,
        suggestFeedbackForm: false,
        errorType: 'server_error'
      });
    }
  }, [checkUserRole]);

  // Handle email input changes with debouncing
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    setError('');
    
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Reset states when email changes
    if (!newEmail) {
      setUserRoleInfo(null);
      setEmailChecked(false);
      setIsCheckingRole(false);
      setMode('signin'); // Default to signin when no email
      return;
    }
    
    // Only start debounced check for valid-looking emails
    if (isValidEmail(newEmail)) {
      // Set timeout for debounced role checking
      debounceTimeoutRef.current = setTimeout(() => {
        debouncedRoleCheck(newEmail);
      }, 800); // 800ms delay
    } else {
      // Reset role info for invalid emails
      setUserRoleInfo(null);
      setEmailChecked(false);
      setIsCheckingRole(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Use explicit domain for production, fallback to current origin for dev
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth/reset`
        : 'https://www.numina.cam/auth/reset';
      
      console.log('DEBUG: Attempting password reset for email:', email);
      console.log('DEBUG: Using redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      console.log('DEBUG: Password reset response:', { data, error });
      
      if (!error) {
        setResetEmailSent(true);
        setError('');
        console.log('DEBUG: Password reset email sent successfully');
      } else {
        console.error('DEBUG: Password reset error:', error);
        setError(error.message);
      }
    } catch (err) {
      console.error('DEBUG: Password reset exception:', err);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'forgot-password') {
      return handlePasswordReset(e);
    }
    
    setLoading(true);
    setError('');

    try {
      let result;
      
      if (mode === 'magic-link') {
        result = await signInWithMagicLink(email);
        if (!result.error) {
          setMagicLinkSent(true);
          setError('');
        }
      } else {
        // DEV MODE: For test accounts on localhost, try signin first, then signup if it fails
        const isDevelopment = window.location.hostname === 'localhost';
        const isTestEmail = email.includes('test') || email.includes('demo');
        
        if (isDevelopment && isTestEmail && mode === 'signin') {
          console.log('DEBUG: Dev mode - attempting signin for test account');
          result = await signIn(email, password);
          
          // If signin fails with invalid credentials, automatically try signup
          if (result.error && result.error.message?.includes('Invalid login credentials')) {
            console.log('DEBUG: Test account not found, creating new account');
            result = await signUp(email, password);
            
            if (!result.error) {
              // After successful signup, sign in immediately
              console.log('DEBUG: Test account created, signing in');
              result = await signIn(email, password);
            }
          }
        } else {
          // Normal flow for production or non-test accounts
          result = mode === 'signin' 
            ? await signIn(email, password)
            : await signUp(email, password);
        }
          
        console.log('DEBUG: AuthModal received result:', result);
          
        if (!result.error) {
          console.log('DEBUG: No error, closing modal');
          onClose();
          setEmail('');
          setPassword('');
        } else {
          console.log('DEBUG: Error present, showing error:', result.error);
        }
      }

      if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Camera className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'signin' ? 'Welcome Back' : 
               mode === 'signup' ? 'Join Numina' : 
               mode === 'forgot-password' ? 'Reset Password' :
               'Quick Sign In'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {magicLinkSent && mode === 'magic-link' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Magic link sent! Check your email and click the link to sign in.</span>
              </div>
            </div>
          )}
          
          {resetEmailSent && mode === 'forgot-password' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Password reset link sent! Check your email to reset your password.</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={
                  mode === 'magic-link' ? 'your@email.com' : 'photographer@example.com'
                }
                required
              />
              {isCheckingRole && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>
          </div>

          {mode !== 'magic-link' && mode !== 'forgot-password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {mode === 'signin' && (
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      setError('');
                      setResetEmailSent(false);
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Server Error Message */}
          {emailChecked && userRoleInfo?.errorType === 'server_error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                Connection issue occurred. Please check your internet connection and try again.
              </p>
            </div>
          )}

          {/* Unregistered Email Message - Only show in signin mode, not in signup or forgot-password */}
          {mode === 'signin' && emailChecked && userRoleInfo?.errorType === 'not_found' && !userRoleInfo.isRegistered && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-sm text-yellow-800">
                  <strong>Email not found.</strong> This email is not registered in our system.
                </p>
                {userRoleInfo.suggestFeedbackForm ? (
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-700">
                      To join Numina, please complete our feedback form and we'll get you set up!
                    </p>
                    <button
                      onClick={() => {
                        if (onOpenFeedback) {
                          onOpenFeedback();
                          onClose(); // Close auth modal when opening feedback
                        }
                      }}
                      className="inline-flex items-center text-sm text-yellow-800 hover:text-yellow-900 font-medium underline"
                    >
                      Complete Feedback Form →
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-yellow-700">
                    Admin accounts require an invitation. Please contact support.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Registered User Messages */}
          {mode === 'magic-link' && !magicLinkSent && emailChecked && userRoleInfo?.isRegistered && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                {userRoleInfo?.isAdmin 
                  ? "Magic link sign-in is ready. You can also use password sign-in below if you prefer."
                  : "We'll send you a secure link to sign in instantly. No password needed!"
                }
              </p>
            </div>
          )}

          {mode === 'signin' && emailChecked && userRoleInfo?.isRegistered && userRoleInfo?.isAdmin && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-700">
                Admin/Photographer account detected. You can also use magic link sign-in below if you prefer.
              </p>
            </div>
          )}

          {/* Checking Role Indicator */}
          {isCheckingRole && email && isValidEmail(email) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                <span>Checking registration status...</span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading || 
              magicLinkSent || 
              resetEmailSent ||
              (mode === 'signin' && emailChecked && userRoleInfo?.errorType === 'not_found' && !userRoleInfo.isRegistered) ||
              (mode === 'signin' && emailChecked && userRoleInfo?.errorType === 'server_error')
            }
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Please wait...' : 
             magicLinkSent ? 'Magic link sent!' :
             resetEmailSent ? 'Reset email sent!' :
             (emailChecked && userRoleInfo?.errorType === 'not_found' && !userRoleInfo.isRegistered) ? 'Email not registered' :
             (emailChecked && userRoleInfo?.errorType === 'server_error') ? 'Connection issue' :
             mode === 'signin' ? 'Sign In' : 
             mode === 'signup' ? 'Create Account' :
             mode === 'forgot-password' ? 'Send Reset Email' :
             'Send Magic Link'}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 pb-6 text-center space-y-3">
          {/* Only show footer options for registered users or when no email checked yet */}
          {mode !== 'magic-link' && emailChecked && userRoleInfo?.isRegistered && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
              
              {userRoleInfo && (
                <>
                  <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-3 text-xs text-gray-500">OR</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setMode('magic-link');
                      setMagicLinkSent(false);
                      setError('');
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center space-x-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>Sign in with magic link instead</span>
                  </button>
                </>
              )}
            </div>
          )}
          
          {mode === 'magic-link' && emailChecked && userRoleInfo?.isRegistered && (
            <div className="space-y-2">
              {userRoleInfo.isAdmin && (
                <button
                  onClick={() => {
                    setMode('signin');
                    setMagicLinkSent(false);
                    setError('');
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center space-x-1"
                >
                  <Lock className="h-3 w-3" />
                  <span>Use password sign-in instead</span>
                </button>
              )}
              
              <p className="text-xs text-gray-500">
                {userRoleInfo.isAdmin 
                  ? "As an admin/photographer, you have access to both sign-in methods"
                  : "Magic link provides secure, password-free access"
                }
              </p>
            </div>
          )}
          
          {/* Forgot password footer */}
          {mode === 'forgot-password' && (
            <div className="space-y-2">
              <button
                onClick={() => {
                  setMode('signin');
                  setResetEmailSent(false);
                  setError('');
                }}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                ← Back to sign in
              </button>
            </div>
          )}

          {/* Show default footer when no email checked yet */}
          {!emailChecked && mode !== 'magic-link' && mode !== 'forgot-password' && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
              
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-xs text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
              
              <button
                onClick={() => {
                  setMode('magic-link');
                  setMagicLinkSent(false);
                  setError('');
                }}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center space-x-1"
              >
                <Send className="h-3 w-3" />
                <span>Sign in with magic link</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;