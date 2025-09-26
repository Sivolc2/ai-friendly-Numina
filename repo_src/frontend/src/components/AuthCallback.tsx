import React, { useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface AuthCallbackProps {
  onSuccess: () => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess }) => {
  useEffect(() => {
    // Mock auth callback processing
    const timer = setTimeout(() => {
      console.log('Auth callback processed');
      onSuccess();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner message="Processing authentication..." />
      </div>
    </div>
  );
};