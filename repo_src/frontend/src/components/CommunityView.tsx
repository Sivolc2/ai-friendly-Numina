import React from 'react';
import { ArrowLeft, Calendar, MapPin, Users, Share2 } from 'lucide-react';
import { Community, Profile } from '../types';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface CommunityViewProps {
  community: Community;
  profiles: Profile[];
  onBack: () => void;
  onViewProfile: (profile: Profile) => void;
}

export function CommunityView({ community, profiles, onBack, onViewProfile }: CommunityViewProps) {
  // Scroll to top when CommunityView component mounts or community changes
  useScrollToTop([community.id], { smooth: true });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Directory</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Share2 className="h-4 w-4" />
              <span>Share Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Event Header */}
      <div className="relative">
        <img
          src={community.coverImage}
          alt={community.name}
          className="w-full h-[60vh] min-h-[400px] object-cover bg-gray-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white bg-gradient-to-t from-black/90 to-transparent min-h-[120px]">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">{community.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm drop-shadow-md">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{new Date(community.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{community.location}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>{profiles.length} participants</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Description */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
          <p className="text-gray-700 leading-relaxed mb-4">{community.description}</p>
          
          <div className="flex flex-wrap gap-2">
            {community.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Participants Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Meet the Participants ({profiles.length})
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => onViewProfile(profile)}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={profile.coverPhoto}
                    alt={profile.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{profile.name}</h3>
                  <p className="text-sm text-purple-600 mb-2">{profile.role}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {profile.story}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {profiles.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No participants yet</h3>
            <p className="text-gray-600">
              Participants will appear here once they complete their profiles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityView;