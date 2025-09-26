import React from 'react';
import { Settings, Edit, User } from 'lucide-react';
import { View } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  onEditProfile: () => void;
  onNavigate: (view: View) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onEditProfile, onNavigate }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {user ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.name || 'User Profile'}
                    </h2>
                    <p className="text-gray-600">{user.email}</p>
                    {user.role && (
                      <p className="text-sm text-blue-600 font-medium">{user.role}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onEditProfile}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => onNavigate('settings')}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-6 w-6 text-gray-600" />
                  <span className="text-gray-900">Settings</span>
                </button>

                <button
                  onClick={signOut}
                  className="flex items-center space-x-3 p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                >
                  <User className="h-6 w-6" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Not signed in</h2>
              <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
              <button
                onClick={() => onNavigate('discover')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Discovery
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};