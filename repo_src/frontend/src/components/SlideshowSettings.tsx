import React from 'react';
import { X, Settings, Play, Eye, EyeOff, RotateCcw, MapPin, Calendar } from 'lucide-react';
import { useSlideshowSettings } from '../hooks/useSlideshowSettings';
import type { Event, SlideshowInterval, AnimationSpeed, FilterType } from '../types';

interface SlideshowSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
}

const intervalOptions: Array<{ value: SlideshowInterval; label: string }> = [
  { value: 3000, label: '3 seconds' },
  { value: 5000, label: '5 seconds' },
  { value: 7000, label: '7 seconds' },
  { value: 10000, label: '10 seconds' },
];

const animationSpeedOptions: Array<{ value: AnimationSpeed; label: string; description: string }> = [
  { value: 'fast', label: 'Fast', description: '3s animation' },
  { value: 'medium', label: 'Medium', description: '5s animation' },
  { value: 'slow', label: 'Slow', description: '7s animation' },
];

export const SlideshowSettings: React.FC<SlideshowSettingsProps> = ({
  isOpen,
  onClose,
  events,
}) => {
  const {
    settings,
    isLoading,
    toggleKenBurns,
    setInterval,
    setAnimationSpeed,
    setFilterType,
    setSelectedEvent,
    setSelectedCommunity,
    resetSettings,
  } = useSlideshowSettings();

  const availableCommunities = React.useMemo(() => {
    const communities = new Set<string>();
    events.forEach(event => {
      if (event.location) communities.add(event.location);
      event.tags.forEach(tag => communities.add(tag));
    });
    return Array.from(communities).sort();
  }, [events]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Slideshow Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Ken Burns Effect Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-purple-600" />
              Visual Effects
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Ken Burns Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Ken Burns Effect</label>
                  <p className="text-xs text-gray-500">Cinematic zoom and pan animations</p>
                </div>
                <button
                  onClick={toggleKenBurns}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.kenBurnsEnabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.kenBurnsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Animation Speed */}
              {settings.kenBurnsEnabled && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Animation Speed
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {animationSpeedOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setAnimationSpeed(option.value)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          settings.animationSpeed === option.value
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timing Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Play className="h-5 w-5 mr-2 text-purple-600" />
              Timing
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Time per Photo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {intervalOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setInterval(option.value)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      settings.interval === option.value
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Filter Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Content Filter
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Filter Type */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Show Photos From
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      settings.filterType === 'all'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">All Profiles</div>
                    <div className="text-xs opacity-75">Shuffle through all available photos</div>
                  </button>
                  
                  <button
                    onClick={() => setFilterType('event')}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      settings.filterType === 'event'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Specific Event</div>
                    <div className="text-xs opacity-75">Focus on one event's participants</div>
                  </button>
                  
                  <button
                    onClick={() => setFilterType('community')}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      settings.filterType === 'community'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Community/Location</div>
                    <div className="text-xs opacity-75">Filter by location or tag</div>
                  </button>
                </div>
              </div>

              {/* Event Selection */}
              {settings.filterType === 'event' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Event
                  </label>
                  <select
                    value={settings.selectedEventId || ''}
                    onChange={(e) => setSelectedEvent(e.target.value || undefined)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Choose an event...</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} {event.location && `(${event.location})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Community Selection */}
              {settings.filterType === 'community' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Community/Location
                  </label>
                  <select
                    value={settings.selectedCommunity || ''}
                    onChange={(e) => setSelectedCommunity(e.target.value || undefined)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Choose a community...</option>
                    {availableCommunities.map(community => (
                      <option key={community} value={community}>
                        <MapPin className="h-4 w-4 inline mr-1" />
                        {community}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={resetSettings}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to Defaults</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};