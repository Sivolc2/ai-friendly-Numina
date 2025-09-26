import { useState, useEffect, useCallback } from 'react';
import type { SlideshowSettings, SlideshowInterval, AnimationSpeed, FilterType } from '../types';

const STORAGE_KEY = 'numina_slideshow_settings';
const SETTINGS_VERSION = 1;

const defaultSettings: SlideshowSettings = {
  kenBurnsEnabled: true,
  interval: 5000, // 5 seconds
  animationSpeed: 'medium',
  filterType: 'all',
  selectedEventId: undefined,
  selectedCommunity: undefined,
  version: SETTINGS_VERSION,
};

// Animation speed to duration mapping (in seconds)
const animationSpeedMap = {
  fast: 3,
  medium: 5,
  slow: 7,
};

export const useSlideshowSettings = () => {
  const [settings, setSettings] = useState<SlideshowSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on initialization
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as SlideshowSettings;
        
        // Check if settings need migration
        if (parsed.version !== SETTINGS_VERSION) {
          const migrated = migrateSettings(parsed);
          setSettings(migrated);
          saveSettings(migrated);
        } else {
          setSettings(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load slideshow settings:', error);
      // Fall back to defaults if localStorage is corrupted
      saveSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: SlideshowSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save slideshow settings:', error);
    }
  }, []);

  // Update settings and persist to localStorage
  const updateSettings = useCallback((updates: Partial<SlideshowSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  // Reset to default settings
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
  }, [saveSettings]);

  // Specific setting updaters
  const toggleKenBurns = useCallback(() => {
    updateSettings({ kenBurnsEnabled: !settings.kenBurnsEnabled });
  }, [settings.kenBurnsEnabled, updateSettings]);

  const setInterval = useCallback((interval: SlideshowInterval) => {
    updateSettings({ interval });
  }, [updateSettings]);

  const setAnimationSpeed = useCallback((speed: AnimationSpeed) => {
    updateSettings({ animationSpeed: speed });
  }, [updateSettings]);

  const setFilterType = useCallback((filterType: FilterType) => {
    const updates: Partial<SlideshowSettings> = { filterType };
    
    // Clear selections when changing filter type
    if (filterType === 'all') {
      updates.selectedEventId = undefined;
      updates.selectedCommunity = undefined;
    }
    
    updateSettings(updates);
  }, [updateSettings]);

  const setSelectedEvent = useCallback((eventId: string | undefined) => {
    updateSettings({ 
      selectedEventId: eventId,
      filterType: eventId ? 'event' : 'all'
    });
  }, [updateSettings]);

  const setSelectedCommunity = useCallback((community: string | undefined) => {
    updateSettings({ 
      selectedCommunity: community,
      filterType: community ? 'community' : 'all'
    });
  }, [updateSettings]);

  // Get animation duration in seconds based on speed setting
  const getAnimationDuration = useCallback(() => {
    return animationSpeedMap[settings.animationSpeed];
  }, [settings.animationSpeed]);

  // Get CSS animation classes based on speed
  const getAnimationClasses = useCallback(() => {
    const duration = getAnimationDuration();
    return {
      'animate-ken-burns-zoom-in': `animate-ken-burns-zoom-in-${duration}s`,
      'animate-ken-burns-zoom-out': `animate-ken-burns-zoom-out-${duration}s`,
      'animate-ken-burns-pan-right': `animate-ken-burns-pan-right-${duration}s`,
      'animate-ken-burns-pan-left': `animate-ken-burns-pan-left-${duration}s`,
      'animate-ken-burns-diagonal': `animate-ken-burns-diagonal-${duration}s`,
      'animate-ken-burns-center': `animate-ken-burns-center-${duration}s`,
    };
  }, [getAnimationDuration]);

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    toggleKenBurns,
    setInterval,
    setAnimationSpeed,
    setFilterType,
    setSelectedEvent,
    setSelectedCommunity,
    getAnimationDuration,
    getAnimationClasses,
  };
};

// Migrate old settings to new version
function migrateSettings(oldSettings: any): SlideshowSettings {
  // For version 1, just ensure all required fields exist
  return {
    kenBurnsEnabled: oldSettings.kenBurnsEnabled ?? defaultSettings.kenBurnsEnabled,
    interval: oldSettings.interval ?? defaultSettings.interval,
    animationSpeed: oldSettings.animationSpeed ?? defaultSettings.animationSpeed,
    filterType: oldSettings.filterType ?? defaultSettings.filterType,
    selectedEventId: oldSettings.selectedEventId,
    selectedCommunity: oldSettings.selectedCommunity,
    version: SETTINGS_VERSION,
  };
}