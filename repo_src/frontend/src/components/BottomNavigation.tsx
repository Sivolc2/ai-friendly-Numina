import React from 'react';
import { Home, Users, MessageCircle, Settings, User } from 'lucide-react';
import { View } from '../types';

interface BottomNavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
  unreadMessageCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  onNavigate,
  unreadMessageCount
}) => {
  const navItems = [
    {
      id: 'discover' as View,
      icon: Home,
      label: 'Home',
      isActive: currentView === 'discover' || currentView === 'directory'
    },
    {
      id: 'community-list' as View,
      icon: Users,
      label: 'Communities',
      isActive: currentView === 'community-list'
    },
    {
      id: 'messages' as View,
      icon: MessageCircle,
      label: 'Messages',
      isActive: currentView === 'messages',
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined
    },
    {
      id: 'user-profile' as View,
      icon: User,
      label: 'Profile',
      isActive: currentView === 'user-profile'
    },
    {
      id: 'settings' as View,
      icon: Settings,
      label: 'Settings',
      isActive: currentView === 'settings'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around">
          {navItems.map(({ id, icon: Icon, label, isActive, badge }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6 mb-1" />
                {badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};