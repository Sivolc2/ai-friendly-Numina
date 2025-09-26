import React, { useEffect, useState } from 'react';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthCallbackProps {
  onSuccess: () => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log('AuthCallback mounted, URL:', window.location.href);
    
    // Check if there's an error in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');
    
    if (error) {
      console.log('Auth error:', error, errorDescription);
      setError(errorDescription ? decodeURIComponent(errorDescription) : 'Authentication failed');
      setStatus('error');
      return;
    }
    
    // If no error, assume success and redirect
    setStatus('success');
    
    // Clean URL and redirect
    window.history.replaceState({}, document.title, '/');
    
    setTimeout(() => {
      console.log('AuthCallback redirecting to home');
      onSuccess();
    }, 1000);
  }, [onSuccess]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <Camera className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Numina</h1>
        </div>

        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <h2 className="text-xl font-semibold text-gray-900">Signing you in...</h2>
            <p className="text-gray-600">Please wait while we complete your authentication.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Welcome back!</h2>
            <p className="text-gray-600">
              You've been successfully signed in. Redirecting you now...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">Sign In Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};