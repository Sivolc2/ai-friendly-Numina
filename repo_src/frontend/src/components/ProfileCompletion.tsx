import React from 'react';
import { User } from 'lucide-react';

interface ProfileCompletionProps {
  profileId: string;
  onComplete: () => void;
  editMode?: boolean;
}

export const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  profileId,
  onComplete,
  editMode = false
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {editMode ? 'Edit Profile' : 'Complete Your Profile'}
          </h1>

          <div className="text-center py-8 text-gray-500">
            <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Profile completion functionality coming soon!</p>
            <p className="text-sm mt-2">Profile ID: {profileId}</p>

            <button
              onClick={onComplete}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};