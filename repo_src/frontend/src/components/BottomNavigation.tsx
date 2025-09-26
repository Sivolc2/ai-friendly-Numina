import React from 'react';
import { Home, Calendar, MessageCircle, User, Settings } from 'lucide-react';
import { View } from '../types';

interface BottomNavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
  unreadMessageCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  onNavigate,
  unreadMessageCount = 0
}) => {
  const tabs = [
    {
      id: 'discover' as View,
      label: 'Discover',
      icon: Home,
      activeViews: ['slideshow', 'directory', 'discover', 'profile', 'community'] // Include related views
    },
    {
      id: 'community-list' as View,
      label: 'Community',
      icon: Calendar,
      activeViews: ['community-list']
    },
    {
      id: 'messages' as View,
      label: 'Chat',
      icon: MessageCircle,
      activeViews: ['messages'],
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined
    },
    {
      id: 'user-profile' as View,
      label: 'Profile',
      icon: User,
      activeViews: ['user-profile', 'complete-profile', 'edit-profile']
    },
    {
      id: 'settings' as View,
      label: 'Settings',
      icon: Settings,
      activeViews: ['settings', 'admin', 'feedback']
    }
  ];

  const isTabActive = (tab: typeof tabs[0]) => {
    return tab.activeViews.includes(currentView);
  };

  // Hide bottom navigation on certain full-screen views
  const hideOnViews: View[] = ['auth-callback', 'invitation', 'slideshow'];
  if (hideOnViews.includes(currentView)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isTabActive(tab);
          
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 relative transition-colors ${
                isActive
                  ? 'text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? 'text-purple-600' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-purple-600 rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};