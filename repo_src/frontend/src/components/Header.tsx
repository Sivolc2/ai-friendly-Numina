import React, { useState } from 'react';
import { Camera, Upload, LogIn, LogOut, User, MessageCircle, MessageSquare, Play } from 'lucide-react';
import { View } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { FeedbackModal } from './FeedbackModal';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackInitialType, setFeedbackInitialType] = useState<'bug' | 'feature' | 'feedback' | 'member'>('feedback');
  const { user, userProfile, isAdmin, isPhotographer, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    onNavigate('discover');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => onNavigate('discover')}
            >
              <img src="/images/logo-128.png" alt="Logo" className="h-10 object-contain max-w-[240px]" />
            </div>

            {/* Right Side - Top Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Top Icons */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* 1. Upload Icon (for Admins and Photographers) */}
                {user && (isAdmin || isPhotographer) && (
                  <button
                    onClick={() => onNavigate('upload')}
                    className={`p-2 sm:p-3 rounded-lg transition-colors ${
                      currentView === 'upload' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    title="Upload Photos"
                  >
                    <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                )}
                
                {/* 2. Feedback Icon */}
                <button
                  onClick={() => {
                    setFeedbackInitialType('feedback');
                    setShowFeedbackModal(true);
                  }}
                  className="p-2 sm:p-3 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  title="Give Feedback"
                >
                  <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                
                {/* 3. Slideshow Icon */}
                <button
                  onClick={() => onNavigate('slideshow')}
                  className="p-2 sm:p-3 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  title="Start Slideshow"
                >
                  <Play className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                
                {/* 4. Login/Logout Icon */}
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="p-2 sm:p-3 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      title={userProfile?.name || user.email}
                    >
                      <User className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-48 z-10">
                        <div className="px-3 py-2 border-b border-gray-100">
                          <div className="font-medium text-gray-900 truncate">
                            {userProfile?.name || 'User'}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {user.email}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onNavigate('feedback');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>My Feedback</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="p-2 sm:p-3 rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    title="Sign In"
                  >
                    <LogIn className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onOpenFeedback={() => {
          setShowAuthModal(false);
          setFeedbackInitialType('member');
          setShowFeedbackModal(true);
        }}
      />
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        initialType={feedbackInitialType}
      />
    </>
  );
};