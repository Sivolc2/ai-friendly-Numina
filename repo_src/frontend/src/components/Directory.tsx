import React from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { Profile } from '../types';

interface DirectoryProps {
  profiles: Profile[];
  searchQuery: string;
  selectedFilters: string[];
  onSearchChange: (query: string) => void;
  onFilterToggle: (filter: string) => void;
  onViewProfile: (profile: Profile) => void;
  loading: boolean;
}

export const Directory: React.FC<DirectoryProps> = ({
  profiles,
  searchQuery,
  selectedFilters,
  onSearchChange,
  onFilterToggle,
  onViewProfile,
  loading
}) => {
  // Filter profiles based on search and filters
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.story.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = selectedFilters.length === 0 ||
                          selectedFilters.some(filter => profile.tags.includes(filter));

    return matchesSearch && matchesFilters;
  });

  // Get all unique tags for filter options
  const allTags = Array.from(new Set(profiles.flatMap(p => p.tags))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-300 rounded animate-pulse mb-4 w-1/4"></div>
            <div className="h-4 bg-gray-300 rounded animate-pulse w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-10 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Directory</h1>
          <p className="text-gray-600">Discover and connect with community members</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, role, or interests..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center text-sm text-gray-600 mr-4">
              <Filter className="h-4 w-4 mr-2" />
              Filters:
            </div>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => onFilterToggle(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedFilters.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredProfiles.length} {filteredProfiles.length === 1 ? 'profile' : 'profiles'} found
          </p>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map(profile => (
            <div
              key={profile.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              onClick={() => onViewProfile(profile)}
            >
              {/* Profile Image */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                {profile.coverPhoto ? (
                  <img
                    src={profile.coverPhoto}
                    alt={`${profile.name}'s cover`}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600"></div>
                )}
              </div>

              <div className="p-6">
                {/* Avatar */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 mr-4">
                    {profile.mainPhoto ? (
                      <img
                        src={profile.mainPhoto}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-lg font-semibold">
                          {profile.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                    <p className="text-sm text-gray-600">{profile.role}</p>
                  </div>
                </div>

                {/* Location */}
                {profile.location && (
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.location}
                  </div>
                )}

                {/* Story Preview */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {profile.story}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {profile.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {profile.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{profile.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProfiles.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};