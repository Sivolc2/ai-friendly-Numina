import React, { useState } from 'react';
import { Bell, Moon, Sun, Globe, Shield, HelpCircle } from 'lucide-react';
import { View } from '../types';

interface SettingsProps {
  onNavigate: (view: View) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account preferences</p>
          </div>

          {/* Settings Sections */}
          <div className="divide-y divide-gray-200">
            {/* Notifications */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="h-6 w-6 text-gray-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-600">Receive updates and messages</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {darkMode ? (
                    <Moon className="h-6 w-6 text-gray-600" />
                  ) : (
                    <Sun className="h-6 w-6 text-gray-600" />
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Dark Mode</h3>
                    <p className="text-sm text-gray-600">Switch to dark theme</p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Public Profile */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="h-6 w-6 text-gray-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Public Profile</h3>
                    <p className="text-sm text-gray-600">Make your profile visible to everyone</p>
                  </div>
                </div>
                <button
                  onClick={() => setPublicProfile(!publicProfile)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    publicProfile ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      publicProfile ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="px-6 py-6">
              <button className="flex items-center space-x-3 w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <Shield className="h-6 w-6 text-gray-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Privacy & Security</h3>
                  <p className="text-sm text-gray-600">Manage your privacy settings</p>
                </div>
              </button>
            </div>

            {/* Help & Support */}
            <div className="px-6 py-6">
              <button className="flex items-center space-x-3 w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <HelpCircle className="h-6 w-6 text-gray-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Help & Support</h3>
                  <p className="text-sm text-gray-600">Get help and contact support</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => onNavigate('discover')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Directory
          </button>
        </div>
      </div>
    </div>
  );
};