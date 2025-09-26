import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('discover')}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700"
            >
              Numina
            </button>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => onNavigate('discover')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'discover' || currentView === 'directory'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => onNavigate('slideshow')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'slideshow'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Slideshow
            </button>
            <button
              onClick={() => onNavigate('community-list')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'community-list'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Communities
            </button>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900">
              <Bell className="h-6 w-6" />
            </button>
            <button
              onClick={() => onNavigate('user-profile')}
              className="text-gray-600 hover:text-gray-900"
            >
              <User className="h-6 w-6" />
            </button>
            <button className="md:hidden text-gray-600 hover:text-gray-900">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};