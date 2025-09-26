import React from 'react';
import { DirectorySkeletonGrid } from './SkeletonLoader';

// Static shell component that renders immediately while data loads
export const DirectoryShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section - Static */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Celebrating the Human Spirit
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the stories behind the faces. A beautiful collection of portraits and narratives 
              from coworking spaces, events, and communities worldwide.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs - Static Shell */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            <div className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-900 shadow-sm">
              People
            </div>
            <div className="px-4 py-2 rounded-md text-sm font-medium text-gray-600">
              Events
            </div>
          </div>
          
          {/* Visual Mode Toggle - Static */}
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-900 shadow-sm">
                <div className="h-4 w-4" /> {/* Camera icon placeholder */}
                <span>Photographic</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600">
                <div className="h-4 w-4" /> {/* List icon placeholder */}
                <span>Directory</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Grid */}
        <DirectorySkeletonGrid 
          count={6}
          viewMode="photographic"
          type="profiles"
        />
      </div>
    </div>
  );
};