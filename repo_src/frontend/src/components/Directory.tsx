import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, Users, Eye, EyeOff, Play, Camera, List, Search, Filter } from 'lucide-react';
import { Profile } from '../types';
import { LazyImage } from './LazyImage';
import { DirectorySkeletonGrid } from './SkeletonLoader';
import { useProfileImagePreloader } from '../hooks/useImagePreloader';
import { optimizeImageUrl, generateSrcSet, getResponsiveImageSizes } from '../utils/imageUtils';

interface DirectoryProps {
  profiles: Profile[];
  searchQuery: string;
  selectedFilters: string[];
  onSearchChange: (query: string) => void;
  onFilterToggle: (filter: string) => void;
  onViewProfile: (profile: Profile) => void;
  loading?: boolean;
}

export const Directory: React.FC<DirectoryProps> = ({
  profiles,
  searchQuery,
  selectedFilters,
  onSearchChange,
  onFilterToggle,
  onViewProfile,
  loading = false,
}) => {
  const [viewMode, setViewMode] = useState<'photographic' | 'directory'>('photographic');
  const [showFilters, setShowFilters] = useState(false);
  
  // Preload images for better performance
  const imagePreloader = useProfileImagePreloader(profiles);

  // Get unique tags from all profiles for filtering
  const availableFilters = useMemo(() => {
    const tagSet = new Set<string>();
    profiles.forEach(profile => {
      profile.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    console.log('=== FILTERING PROFILES ===');
    console.log('Total profiles:', profiles.length);
    console.log('Selected filters:', selectedFilters);
    console.log('Search query:', searchQuery);
    
    const filtered = profiles.filter(profile => {
      const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           profile.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           profile.story.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilters = selectedFilters.length === 0 ||
                            selectedFilters.some(filter => profile.tags.includes(filter));
      
      // Debug log for each profile
      if (selectedFilters.length > 0) {
        console.log(`Profile: ${profile.name}, Role: ${profile.role}, Tags:`, profile.tags, 'Matches filters:', matchesFilters);
      }
      
      return matchesSearch && matchesFilters;
    });
    
    console.log('Filtered profiles count:', filtered.length);
    return filtered;
  }, [profiles, searchQuery, selectedFilters]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Celebrating the Human Spirit
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-3">
              Meet the dreamers, the doers, the believers. A heartfelt collection of portraits and narratives from communities and spaces where human connection flourishes.
            </p>
            <p className="text-lg text-purple-600 font-medium">
              Browse {filteredProfiles.length} amazing people
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
            />
          </div>
          
          {availableFilters.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    selectedFilters.length > 0
                      ? 'bg-purple-100 border-purple-300 text-purple-700'
                      : 'border-gray-300 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {selectedFilters.length > 0 && (
                    <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-1">
                      {selectedFilters.length}
                    </span>
                  )}
                </button>
                
                {selectedFilters.length > 0 && (
                  <button
                    onClick={() => selectedFilters.forEach(filter => onFilterToggle(filter))}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('photographic')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'photographic'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  <span>Photographic</span>
                </button>
                <button
                  onClick={() => setViewMode('directory')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'directory'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="h-4 w-4" />
                  <span>Directory</span>
                </button>
              </div>
            </div>
          )}

          {/* Filters Dropdown */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Filter by tags</h3>
              <div className="flex flex-wrap gap-2">
                {availableFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => onFilterToggle(filter)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedFilters.includes(filter)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* People Grid */}
        {loading && (
          <DirectorySkeletonGrid 
            count={6}
            viewMode={viewMode}
            type="profiles"
          />
        )}
        
        {!loading && (
          <div className={`grid gap-6 ${
            viewMode === 'photographic' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {filteredProfiles.map((profile, index) => {
              const imageUrl = profile.mainPhoto || profile.coverPhoto;
              const responsiveSizes = getResponsiveImageSizes(viewMode);
              const optimizedUrl = optimizeImageUrl(imageUrl, { 
                width: viewMode === 'photographic' ? 400 : 300,
                quality: 85 
              });
              const srcSet = generateSrcSet(imageUrl, responsiveSizes.widths);
              
              return viewMode === 'photographic' ? (
                // Photographic Mode - Photos Only
                <div
                  key={profile.id}
                  onClick={() => onViewProfile(profile)}
                  className="group cursor-pointer overflow-hidden rounded-lg"
                >
                  <div className="relative aspect-[4/5]">
                    <LazyImage
                      src={optimizedUrl}
                      srcSet={srcSet}
                      sizes={responsiveSizes.sizes}
                      alt={profile.name}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                      priority={index < 3} // Prioritize first 3 images
                      width={responsiveSizes.widths[0]} // Use smallest width for photographic grid
                      enableFormatOptimization={true} // Re-enabled for image loading
                    />
                    {profile.videoUrl && (
                      <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play className="h-3 w-3 text-purple-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <h3 className="font-semibold text-sm mb-1">{profile.name}</h3>
                      <p className="text-xs opacity-90">{profile.role}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Directory Mode - Full Details
                <div
                  key={profile.id}
                  onClick={() => onViewProfile(profile)}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <div className="relative">
                    <LazyImage
                      src={optimizedUrl}
                      srcSet={srcSet}
                      sizes={responsiveSizes.sizes}
                      alt={profile.name}
                      className="w-full aspect-[4/5] group-hover:scale-105 transition-transform duration-300"
                      priority={index < 3} // Prioritize first 3 images
                      width={640} // Larger width for directory mode
                      enableFormatOptimization={true} // Re-enabled for image loading
                    />
                    {profile.videoUrl && (
                      <div className="absolute top-3 right-3 bg-white/90 rounded-full p-2">
                        <Play className="h-4 w-4 text-purple-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{profile.name}</h3>
                    <p className="text-sm text-purple-600 mb-2">{profile.role}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {profile.story}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{profile.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {profile.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
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
                  </div>
                </div>
              );
            })}
          </div>
        )}


        {/* Empty State */}
        {filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No people found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedFilters.length > 0
                ? 'Try adjusting your search or filters'
                : 'No profiles have been added yet'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};