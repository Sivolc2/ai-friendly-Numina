import React from 'react';
import { ArrowLeft, MapPin, Users, Calendar } from 'lucide-react';
import { Community, Profile } from '../types';

interface CommunityViewProps {
  community: Community;
  profiles: Profile[];
  onBack: () => void;
  onViewProfile: (profile: Profile) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  community,
  profiles,
  onBack,
  onViewProfile
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-64 bg-gradient-to-br from-green-500 to-blue-600">
          {community.coverPhoto && (
            <img
              src={community.coverPhoto}
              alt={`${community.name} cover`}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/30 transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        {/* Community Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2">{community.name}</h1>
            <p className="text-xl opacity-90 mb-4">{community.description}</p>
            <div className="flex items-center space-x-6 text-sm opacity-80">
              {community.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{community.location}</span>
                </div>
              )}
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{profiles.length} members</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Created {new Date(community.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tags */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {community.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Members ({profiles.length})
          </h2>

          {profiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map(profile => (
                <div
                  key={profile.id}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onViewProfile(profile)}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-4 flex-shrink-0">
                    {profile.mainPhoto ? (
                      <img
                        src={profile.mainPhoto}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {profile.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {profile.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {profile.role}
                    </p>
                    {profile.location && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{profile.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags Preview */}
                  <div className="flex flex-wrap gap-1 ml-4">
                    {profile.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {profile.tags.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{profile.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No members in this community yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};