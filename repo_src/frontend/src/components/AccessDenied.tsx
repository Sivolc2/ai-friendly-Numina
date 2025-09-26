import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

interface AccessDeniedProps {
  onBack: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="mb-6">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page. Please sign in with an authorized account.
          </p>
        </div>
        
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Directory</span>
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;

export { AccessDenied }