import React from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';

interface UserFeedbackCenterProps {
  onBack: () => void;
}

export const UserFeedbackCenter: React.FC<UserFeedbackCenterProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Feedback Center</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Feedback center functionality coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};