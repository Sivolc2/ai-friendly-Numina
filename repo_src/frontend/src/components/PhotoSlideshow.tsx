import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Grid, X, Menu, Camera, Settings } from 'lucide-react';
import type { Profile, Event } from '../types';
import { useSlideshowSettings } from '../hooks/useSlideshowSettings';
import { SlideshowSettings } from './SlideshowSettings';

interface PhotoSlideshowProps {
  profiles: Profile[];
  events: Event[];
  onViewProfile: (profile: Profile) => void;
  onOpenApp: () => void;
}

// Ken Burns animation variants
const kenBurnsAnimations = [
  'animate-ken-burns-zoom-in',
  'animate-ken-burns-zoom-out', 
  'animate-ken-burns-pan-right',
  'animate-ken-burns-pan-left',
  'animate-ken-burns-diagonal',
  'animate-ken-burns-center'
];

export const PhotoSlideshow: React.FC<PhotoSlideshowProps> = ({
  profiles,
  events,
  onViewProfile,
  onOpenApp,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState(kenBurnsAnimations[0]);
  const [clickCount, setClickCount] = useState(0);
  const [randomOrder, setRandomOrder] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  
  const { settings, getAnimationDuration } = useSlideshowSettings();

  // Filter profiles based on settings
  const filteredProfiles = useMemo(() => {
    let filtered = profiles.filter(p => p.mainPhoto || p.coverPhoto);
    
    if (settings.filterType === 'event' && settings.selectedEventId) {
      filtered = filtered.filter(p => p.eventId === settings.selectedEventId);
    } else if (settings.filterType === 'community' && settings.selectedCommunity) {
      filtered = filtered.filter(p => {
        const event = events.find(e => e.id === p.eventId);
        return event?.location === settings.selectedCommunity || 
               event?.tags.includes(settings.selectedCommunity) || false;
      });
    }
    
    return filtered;
  }, [profiles, events, settings.filterType, settings.selectedEventId, settings.selectedCommunity]);

  // Generate random order for slideshow
  useEffect(() => {
    if (filteredProfiles.length > 0) {
      const shuffled = Array.from({length: filteredProfiles.length}, (_, i) => i)
        .sort(() => Math.random() - 0.5);
      setRandomOrder(shuffled);
      setCurrentIndex(0);
      
      // Preload first few images for smooth start
      const preloadImages = async () => {
        const imagesToPreload = Math.min(3, filteredProfiles.length);
        const preloadPromises = [];
        
        for (let i = 0; i < imagesToPreload; i++) {
          const profile = filteredProfiles[shuffled[i]];
          const imageUrl = profile.mainPhoto || profile.coverPhoto || '';
          if (imageUrl) {
            const promise = new Promise((resolve) => {
              const img = new Image();
              img.onload = resolve;
              img.onerror = resolve; // Resolve even on error to not block
              img.src = imageUrl;
            });
            preloadPromises.push(promise);
          }
        }
        
        // Add timeout to prevent infinite loading - longer for mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const timeoutDuration = isMobile ? 8000 : 3000; // 8s for mobile, 3s for desktop
        console.log(`PhotoSlideshow: Setting preload timeout to ${timeoutDuration}ms (mobile: ${isMobile})`);
        
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(resolve, timeoutDuration);
        });
        
        // Wait for either all images to load or timeout
        try {
          await Promise.race([
            Promise.all(preloadPromises),
            timeoutPromise
          ]);
          console.log('PhotoSlideshow: Image preloading completed or timed out');
        } catch (error) {
          console.warn('PhotoSlideshow: Error during image preloading:', error);
        } finally {
          // Always clear loading state, even if preloading fails
          setImagesPreloaded(true);
          setIsInitialLoad(false);
          console.log('PhotoSlideshow: Initial load state cleared');
        }
      };
      
      preloadImages();
    }
  }, [filteredProfiles]);

  // Preload next images when current index changes
  useEffect(() => {
    if (randomOrder.length === 0 || filteredProfiles.length === 0) return;
    
    // Preload next 2 images
    const preloadNext = () => {
      for (let i = 1; i <= 2; i++) {
        const nextIndex = (currentIndex + i) % randomOrder.length;
        const profile = filteredProfiles[randomOrder[nextIndex]];
        if (profile) {
          const imageUrl = profile.mainPhoto || profile.coverPhoto || '';
          if (imageUrl) {
            const img = new Image();
            img.src = imageUrl;
          }
        }
      }
    };
    
    preloadNext();
  }, [currentIndex, randomOrder, filteredProfiles]);

  // Auto-advance slideshow with random selection
  useEffect(() => {
    if (!isPlaying || isPaused || randomOrder.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % randomOrder.length);
      // Random animation for each transition (only if Ken Burns is enabled)
      if (settings.kenBurnsEnabled) {
        setCurrentAnimation(kenBurnsAnimations[Math.floor(Math.random() * kenBurnsAnimations.length)]);
      }
    }, settings.interval);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, randomOrder.length, settings.interval, settings.kenBurnsEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
      if (e.key === 'Escape') onOpenApp();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % randomOrder.length);
    if (settings.kenBurnsEnabled) {
      setCurrentAnimation(kenBurnsAnimations[Math.floor(Math.random() * kenBurnsAnimations.length)]);
    }
    setIsPaused(true);
    setIsPlaying(false);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + randomOrder.length) % randomOrder.length);
    if (settings.kenBurnsEnabled) {
      setCurrentAnimation(kenBurnsAnimations[Math.floor(Math.random() * kenBurnsAnimations.length)]);
    }
    setIsPaused(true);
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    setIsPaused(!isPaused);
  };

  const resumeSlideshow = () => {
    setIsPlaying(true);
    setIsPaused(false);
    setShowControls(false);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextPhoto();
    if (isRightSwipe) prevPhoto();
  };

  // Handle single/double click
  const handlePhotoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    setClickCount(prev => prev + 1);
    
    setTimeout(() => {
      if (clickCount === 0) {
        // Single click - pause/unpause
        togglePlayPause();
        setShowControls(true);
      } else if (clickCount === 1) {
        // Double click - view profile
        if (randomOrder.length > 0 && filteredProfiles[randomOrder[currentIndex]]) {
          onViewProfile(filteredProfiles[randomOrder[currentIndex]]);
        }
      }
      setClickCount(0);
    }, 300);
  };

  // Show loading if profiles haven't been fetched yet
  if (profiles.length === 0) {
    console.log('PhotoSlideshow: Showing loading state - no profiles loaded');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          {/* Beautiful ripple loading animation */}
          <style>{`
            @keyframes ripple {
              0% {
                transform: scale(0.8);
                opacity: 1;
              }
              100% {
                transform: scale(2.5);
                opacity: 0;
              }
            }
          `}</style>
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-20 relative">
              {/* Ripple rings */}
              <div 
                className="absolute inset-0 rounded-full border-2 border-purple-600/40"
                style={{ animation: 'ripple 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite' }}
              ></div>
              <div 
                className="absolute inset-0 rounded-full border-2 border-purple-600/40"
                style={{ animation: 'ripple 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite', animationDelay: '0.7s' }}
              ></div>
              <div 
                className="absolute inset-0 rounded-full border-2 border-purple-600/40"
                style={{ animation: 'ripple 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite', animationDelay: '1.4s' }}
              ></div>
              {/* Center logo */}
              <img src="/images/Numina-Logo-Only-200.png" alt="Numina" className="absolute inset-0 m-auto h-12 w-12 object-contain z-10" />
            </div>
          </div>
          <h2 className="text-xl text-white/80 font-light mb-2 mt-8">Loading Slideshow</h2>
          <p className="text-sm text-white/50">Preparing your Numina experience...</p>
        </div>
      </div>
    );
  }

  // Show "No photos" only if profiles are loaded but none have photos
  if (filteredProfiles.length === 0 && profiles.length > 0) {
    console.log('PhotoSlideshow: No photos available - profiles loaded but no photos');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Camera className="h-16 w-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl mb-4">No photos available</h2>
          <button
            onClick={onOpenApp}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Open Discovery
          </button>
        </div>
      </div>
    );
  }

  // Show loading animation while initial images are being preloaded
  if (isInitialLoad && randomOrder.length > 0) {
    console.log('PhotoSlideshow: Showing preload loading state', { 
      isInitialLoad, 
      randomOrderLength: randomOrder.length,
      imagesPreloaded 
    });
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          {/* Beautiful ripple loading animation */}
          <style>{`
            @keyframes ripple {
              0% {
                transform: scale(0.8);
                opacity: 1;
              }
              100% {
                transform: scale(2.5);
                opacity: 0;
              }
            }
          `}</style>
          <div className="relative">
            <div className="w-24 h-24 mx-auto mb-20 relative">
              {/* Ripple rings */}
              <div 
                className="absolute inset-0 rounded-full border-2 border-purple-600/40"
                style={{ animation: 'ripple 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite' }}
              ></div>
              <div 
                className="absolute inset-0 rounded-full border-2 border-purple-600/40"
                style={{ animation: 'ripple 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite', animationDelay: '0.7s' }}
              ></div>
              <div 
                className="absolute inset-0 rounded-full border-2 border-purple-600/40"
                style={{ animation: 'ripple 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite', animationDelay: '1.4s' }}
              ></div>
              {/* Center logo */}
              <img src="/images/Numina-Logo-Only-200.png" alt="Numina" className="absolute inset-0 m-auto h-12 w-12 object-contain z-10" />
            </div>
          </div>
          <h2 className="text-xl text-white/80 font-light mb-2 mt-8">Loading Slideshow</h2>
          <p className="text-sm text-white/50">Preparing your Numina experience...</p>
        </div>
      </div>
    );
  }

  // Wait for random order to be generated
  if (randomOrder.length === 0) {
    console.log('PhotoSlideshow: Waiting for random order generation', { 
      filteredProfilesLength: filteredProfiles.length,
      randomOrderLength: randomOrder.length 
    });
    return null;
  }

  const currentProfile = filteredProfiles[randomOrder[currentIndex]];
  const photoUrl = currentProfile.mainPhoto || currentProfile.coverPhoto || '';
  
  console.log('PhotoSlideshow: Rendering slideshow', {
    currentIndex,
    totalProfiles: filteredProfiles.length,
    currentProfileName: currentProfile?.name,
    hasPhotoUrl: !!photoUrl
  });

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Add Ken Burns CSS animations */}
      <style>{`
        @keyframes ken-burns-zoom-in {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(0, 0); }
        }
        @keyframes ken-burns-zoom-out {
          0% { transform: scale(1.1) translate(0, 0); }
          100% { transform: scale(1) translate(0, 0); }
        }
        @keyframes ken-burns-pan-right {
          0% { transform: scale(1.1) translate(-2%, 0); }
          100% { transform: scale(1.1) translate(2%, 0); }
        }
        @keyframes ken-burns-pan-left {
          0% { transform: scale(1.1) translate(2%, 0); }
          100% { transform: scale(1.1) translate(-2%, 0); }
        }
        @keyframes ken-burns-diagonal {
          0% { transform: scale(1) translate(-1%, -1%); }
          100% { transform: scale(1.1) translate(1%, 1%); }
        }
        @keyframes ken-burns-center {
          0% { transform: scale(1) translate(0, 2%); }
          100% { transform: scale(1.1) translate(0, -2%); }
        }
        .animate-ken-burns-zoom-in { animation: ken-burns-zoom-in ${getAnimationDuration()}s ease-in-out; }
        .animate-ken-burns-zoom-out { animation: ken-burns-zoom-out ${getAnimationDuration()}s ease-in-out; }
        .animate-ken-burns-pan-right { animation: ken-burns-pan-right ${getAnimationDuration()}s ease-in-out; }
        .animate-ken-burns-pan-left { animation: ken-burns-pan-left ${getAnimationDuration()}s ease-in-out; }
        .animate-ken-burns-diagonal { animation: ken-burns-diagonal ${getAnimationDuration()}s ease-in-out; }
        .animate-ken-burns-center { animation: ken-burns-center ${getAnimationDuration()}s ease-in-out; }
      `}</style>

      {/* Logo/Brand in top left - click to resume */}
      <div 
        className="absolute top-6 left-6 z-30 cursor-pointer group"
        onClick={resumeSlideshow}
      >
        <div className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all">
          <img src="/images/logo-64.png" alt="Logo" className="h-12 object-contain max-w-[160px] group-hover:opacity-75 transition-all" />
        </div>
      </div>

      {/* Navigation button - top right without dark background */}
      <div 
        className="absolute top-6 right-6 z-30"
      >
        <button
          onClick={onOpenApp}
          className={`flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
        >
          <Grid className="h-4 w-4 text-white" />
          <span className="text-white">Discovery</span>
        </button>
      </div>

      {/* Main photo display with Ken Burns effect */}
      <div 
        className="relative h-full flex items-center justify-center cursor-pointer"
        onClick={handlePhotoClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isPaused && setShowControls(false)}
      >
        {/* Photo with optional Ken Burns animation and optimization */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={photoUrl}
            alt={currentProfile.name}
            className={`
              /* Mobile: Fill screen with center crop */
              w-full h-full object-cover
              /* Desktop: Scale and position to fill completely without black bars */
              md:absolute md:inset-0 md:w-full md:h-[110%] 
              md:object-cover md:object-top md:-top-[10%]
              ${settings.kenBurnsEnabled ? currentAnimation : ''}
            `}
            loading="eager" // Always load eagerly for slideshow
          />
        </div>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Profile info overlay */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-8 pb-24 transition-opacity duration-300 ${showControls || isPaused ? 'opacity-100' : 'opacity-0'}`}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{currentProfile.name}</h2>
            {currentProfile.role && (
              <p className="text-xl text-white/90 mb-2 drop-shadow-lg">{currentProfile.role}</p>
            )}
            {currentProfile.location && (
              <p className="text-lg text-white/70 drop-shadow-lg">{currentProfile.location}</p>
            )}
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevPhoto();
          }}
          className={`absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all duration-300 ${showControls || isPaused ? 'opacity-100' : 'opacity-0'}`}
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            nextPhoto();
          }}
          className={`absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all duration-300 ${showControls || isPaused ? 'opacity-100' : 'opacity-0'}`}
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>

        {/* Instructional text - bottom center */}
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 drop-shadow-lg text-center transition-opacity duration-300 ${showControls || isPaused ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm">Single click to pause</p>
          <p className="text-sm">Double click to view profile</p>
        </div>
      </div>

      {/* Settings button - always visible in bottom right */}
      <div className="absolute bottom-8 right-8 z-20">
        <button
          onClick={() => setShowSettings(true)}
          className="p-3 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all hover:scale-110 group"
          title="Slideshow Settings"
        >
          <Settings className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Bottom controls */}
      <div className={`absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center space-x-6 transition-opacity duration-300 ${showControls || isPaused ? 'opacity-100' : 'opacity-0'}`}>
        {/* Play/Pause button */}
        <button
          onClick={togglePlayPause}
          className="p-3 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-colors"
        >
          {isPlaying && !isPaused ? (
            <Pause className="h-5 w-5 text-white" />
          ) : (
            <Play className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Progress indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-white/70 text-sm">
            {currentIndex + 1} / {filteredProfiles.length}
          </span>
          <div className="w-32 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / filteredProfiles.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SlideshowSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        events={events}
      />
    </div>
  );
};