import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, TrendingUp, Users } from 'lucide-react';
import { usePhotoAnalytics, PhotoAnalytics } from '../hooks/usePhotoAnalytics';

export const PhotoAnalyticsSection: React.FC = () => {
  const { getPhotoInteractionStats, loading, error } = usePhotoAnalytics();
  const [analytics, setAnalytics] = useState<PhotoAnalytics | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await getPhotoInteractionStats();
      if (data) {
        setAnalytics(data);
      }
    };
    loadAnalytics();
  }, [getPhotoInteractionStats]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-600">Error loading photo analytics: {error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-gray-500">No photo engagement data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-pink-100">Total Loves</p>
              <p className="text-3xl font-bold">{analytics.totalLoves.toLocaleString()}</p>
            </div>
            <Heart className="h-8 w-8 text-pink-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Total Comments</p>
              <p className="text-3xl font-bold">{analytics.totalComments.toLocaleString()}</p>
            </div>
            <MessageCircle className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">Engagement Rate</p>
              <p className="text-3xl font-bold">{analytics.engagementRate}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">Active Profiles</p>
              <p className="text-3xl font-bold">{analytics.activeProfiles.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Top Content & Commenters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Engaged Photos */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-medium text-gray-900 mb-4">Top Engaged Photos</h4>
          <div className="space-y-4">
            {analytics.mostLovedPhoto && (
              <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                <img 
                  src={analytics.mostLovedPhoto.photoUrl} 
                  alt="Most loved" 
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {analytics.mostLovedPhoto.profileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analytics.mostLovedPhoto.loveCount} loves
                  </p>
                </div>
                <Heart className="h-4 w-4 text-pink-500" />
              </div>
            )}
            
            {analytics.mostCommentedPhoto && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <img 
                  src={analytics.mostCommentedPhoto.photoUrl} 
                  alt="Most commented" 
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {analytics.mostCommentedPhoto.profileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analytics.mostCommentedPhoto.commentCount} comments
                  </p>
                </div>
                <MessageCircle className="h-4 w-4 text-blue-500" />
              </div>
            )}
          </div>
        </div>

        {/* Top Commenters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-medium text-gray-900 mb-4">Top Commenters</h4>
          <div className="space-y-3">
            {analytics.topCommenters.length > 0 ? (
              analytics.topCommenters.map((commenter, index) => (
                <div key={commenter.profileId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {commenter.profileName}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {commenter.commentCount} comments
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No commenters yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="font-medium text-gray-900 mb-4">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalPhotos.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Photos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalInteractions.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Interactions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {analytics.totalPhotos > 0 ? (analytics.totalInteractions / analytics.totalPhotos).toFixed(1) : '0'}
            </p>
            <p className="text-sm text-gray-500">Avg per Photo</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {analytics.totalComments > 0 ? (analytics.totalLoves / analytics.totalComments).toFixed(1) : '0'}
            </p>
            <p className="text-sm text-gray-500">Love/Comment Ratio</p>
          </div>
        </div>
      </div>
    </div>
  );
};