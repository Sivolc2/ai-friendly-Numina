import React, { useState, Suspense, lazy } from 'react';
import { Settings as SettingsIcon, Shield, MessageSquare, LogOut, Bell, Lock, HelpCircle, Info, Play } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { LoadingSpinner } from './LoadingSpinner';
import { FeedbackModal } from './FeedbackModal';

// Lazy load the admin dashboard
const AdminDashboard = lazy(() => import('./AdminDashboard').then(module => ({ default: module.AdminDashboard })));

interface SettingsProps {
  onNavigate: (view: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const { user, userProfile, isAdmin, signOut } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'feedback' | 'member'>('feedback');
  const [slideshowDefault, setSlideshowDefault] = useState(() => {
    const stored = localStorage.getItem('slideshowDefault');
    if (stored === null) {
      // Default to true (slideshow) if no setting exists
      localStorage.setItem('slideshowDefault', 'true');
      return true;
    }
    return stored === 'true';
  });

  useScrollToTop([], { smooth: false });

  const handleSignOut = async () => {
    await signOut();
    onNavigate('discover');
  };

  const openFeedback = (type: 'bug' | 'feature' | 'feedback' | 'member') => {
    setFeedbackType(type);
    setShowFeedbackModal(true);
  };

  const toggleSlideshowDefault = () => {
    const newValue = !slideshowDefault;
    setSlideshowDefault(newValue);
    localStorage.setItem('slideshowDefault', newValue.toString());
  };

  if (showAdminPanel && isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => setShowAdminPanel(false)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Settings
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          
          <Suspense fallback={<LoadingSpinner message="Loading admin dashboard..." />}>
            <AdminDashboard onBack={() => setShowAdminPanel(false)} />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

          {/* App Preferences Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>Preferences</span>
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Play className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Default to Slideshow</div>
                      <div className="text-sm text-gray-500">Start with slideshow when opening the app</div>
                    </div>
                  </div>
                  <button 
                    onClick={toggleSlideshowDefault}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      slideshowDefault ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      slideshowDefault ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Notifications</div>
                      <div className="text-sm text-gray-500">Manage your notification preferences</div>
                    </div>
                  </div>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    Configure
                  </button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Privacy</div>
                      <div className="text-sm text-gray-500">Control who can see your profile</div>
                    </div>
                  </div>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    Manage
                  </button>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Help & Support</div>
                      <div className="text-sm text-gray-500">Get help using Numina</div>
                    </div>
                  </div>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Panel Section - Only for Admins */}
          {isAdmin && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Admin Tools</span>
                </h2>
                
                <div className="space-y-4">
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="w-full flex items-center justify-between py-3 px-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <SettingsIcon className="h-5 w-5 text-red-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Admin Dashboard</div>
                        <div className="text-sm text-gray-500">Manage users, events, and system settings</div>
                      </div>
                    </div>
                    <span className="text-red-600">→</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback & Support Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Feedback & Support</span>
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={() => onNavigate('feedback')}
                  className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">My Feedback</div>
                      <div className="text-sm text-gray-500">View your submitted feedback and requests</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button
                  onClick={() => openFeedback('bug')}
                  className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-red-500">🐛</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Report a Bug</div>
                      <div className="text-sm text-gray-500">Something not working correctly?</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button
                  onClick={() => openFeedback('feature')}
                  className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-500">💡</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Request a Feature</div>
                      <div className="text-sm text-gray-500">Have an idea to make Numina better?</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button
                  onClick={() => openFeedback('feedback')}
                  className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-green-500">💬</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">General Feedback</div>
                      <div className="text-sm text-gray-500">Share your thoughts about the platform</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* App Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>About</span>
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">Numina</div>
                    <div className="text-sm text-gray-500">Portrait & Story Platform</div>
                  </div>
                  <div className="text-sm text-gray-500">v1.0.0</div>
                </div>
                
                <div className="py-3">
                  <div className="text-sm text-gray-700">
                    Discover the stories behind the faces. A beautiful collection of portraits and narratives from coworking spaces, events, and communities worldwide.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        initialType={feedbackType}
      />
    </>
  );
};