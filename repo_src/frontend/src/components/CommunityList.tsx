import React, { useState } from 'react';
import { Calendar, MapPin, Users, Search, Filter } from 'lucide-react';
import { Community, Profile } from '../types';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { CommunityManager } from './CommunityManager';

interface CommunityListProps {
  communities: Community[];
  profiles: Profile[];
  onViewCommunity: (community: Community) => void;
  loading?: boolean;
}

export const CommunityList: React.FC<CommunityListProps> = ({
  communities,
  profiles,
  onViewCommunity,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState<'community' | 'manage'>('community');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useScrollToTop([], { smooth: false });

  // Calculate participant count for a community
  const getParticipantCount = (communityId: string) => {
    return profiles.filter(profile => profile.eventId === communityId).length;
  };

  // Get unique tags from all communities
  const availableFilters = React.useMemo(() => {
    const tagSet = new Set<string>();
    communities.forEach(community => {
      community.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [communities]);

  // Filter communities based on search query and selected filters
  const filteredCommunities = React.useMemo(() => {
    return communities.filter(community => {
      const matchesSearch = searchQuery === '' || 
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilters = selectedFilters.length === 0 ||
        selectedFilters.some(filter => community.tags.includes(filter));

      return matchesSearch && matchesFilters;
    });
  }, [communities, searchQuery, selectedFilters]);

  const toggleFilter = (filter: string) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6 w-48"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="h-6 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2 w-1/2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Community</h1>
            
            {/* Tab Bar */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('community')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'community'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Community ({filteredCommunities.length})
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'manage'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Manage
              </button>
            </div>
          </div>
          
          {/* Search and Filters - Only show for Community tab */}
          {activeTab === 'community' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full"
              />
            </div>
            
            {availableFilters.length > 0 && (
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
                    onClick={() => setSelectedFilters([])}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Clear all
                  </button>
                )}
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
                      onClick={() => toggleFilter(filter)}
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
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'community' ? (
          /* Community List */
          filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No communities found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedFilters.length > 0
                ? 'Try adjusting your search or filters'
                : 'Communities will appear here when they are created'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                onClick={() => onViewCommunity(community)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
              >
                {community.coverImage ? (
                  <div className="relative">
                    <img
                      src={community.coverImage}
                      alt={community.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl font-bold mb-3 drop-shadow-lg">
                        {community.name}
                      </h3>
                      
                      <div className="flex flex-wrap gap-4 text-sm drop-shadow-md mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(community.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{community.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{getParticipantCount(community.id)} participants</span>
                        </div>
                      </div>
                      
                      {community.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {community.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full border border-white/30"
                            >
                              {tag}
                            </span>
                          ))}
                          {community.tags.length > 3 && (
                            <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full border border-white/30">
                              +{community.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {community.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(community.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{community.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{getParticipantCount(community.id)} participants</span>
                      </div>
                    </div>
                    
                    {community.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {community.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-6">
                  <p className="text-gray-600 line-clamp-2">
                    {community.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
        ) : (
          /* Manage Tab */
          <CommunityManager />
        )}
      </div>
    </div>
  );
};