import { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { Directory } from './components/Directory';
import { ProfileView } from './components/ProfileView';
import { CommunityView } from './components/CommunityView';
import { CommunityList } from './components/CommunityList';
import { UserProfile } from './components/UserProfile';
import { Settings } from './components/Settings';
import { BottomNavigation } from './components/BottomNavigation';
import { AccessDenied } from './components/AccessDenied';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DirectoryShell } from './components/DirectoryShell';
import { PhotoSlideshow } from './components/PhotoSlideshow';

// Lazy load ChatPage for better performance
const ChatPage = lazy(() => import('./components/ChatPage').then(module => ({ default: module.ChatPage })));

// Import performance testing for development
import './utils/performanceTest';

// Lazy load heavy components
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const UploadFlow = lazy(() => import('./components/UploadFlow').then(module => ({ default: module.UploadFlow })));
import { useProfiles } from './hooks/useProfiles';
import { useCommunity } from './hooks/useCommunity';
import { useAuth } from './contexts/AuthContext';
import { useScrollToTop } from './hooks/useScrollToTop';
import type { Profile, Community, Event, View } from './types';

export default function App() {
  return <AppContent />;
}

function AppContent() {
  const [currentView, setCurrentView] = useState<View>(() => {
    // Multiple mobile detection methods for better coverage
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isMobileScreen = window.innerWidth <= 768;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = isMobileUA || (isMobileScreen && isTouchDevice);

    console.log('App: Enhanced mobile detection:', {
      isMobile,
      isMobileUA,
      isMobileScreen,
      isTouchDevice,
      screenWidth: window.innerWidth,
      userAgent: userAgent.substring(0, 100) + '...'
    });

    // Check for URL override first - highest priority
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam === 'discover') {
      console.log('App: URL override to discover view');
      return 'discover';
    }
    if (viewParam === 'slideshow') {
      console.log('App: URL override to slideshow view');
      return 'slideshow';
    }

    // Check if slideshow is set as default
    const slideshowDefault = localStorage.getItem('slideshowDefault');
    if (slideshowDefault === null) {
      // For mobile OR small screens, default to discover; for desktop, default to slideshow
      const defaultView = isMobile ? 'discover' : 'slideshow';
      localStorage.setItem('slideshowDefault', isMobile ? 'false' : 'true');
      console.log('App: Setting default view for', isMobile ? 'mobile' : 'desktop', ':', defaultView);
      return defaultView;
    }
    // Start directly with slideshow if it's the default, otherwise discover
    const finalView = slideshowDefault === 'true' ? 'slideshow' : 'discover';
    console.log('App: Using localStorage setting:', finalView);
    return finalView;
  });
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  // const [profileCompletionId, setProfileCompletionId] = useState<string | null>(null);
  // const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [chatTargetProfileId, setChatTargetProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const { profiles, loading: profilesLoading, fetchProfiles } = useProfiles();
  const { communities, fetchCommunities } = useCommunity();
  const events = communities; // Legacy alias for backward compatibility
  const loading = profilesLoading; // Use profiles loading as main loading state
  const { user, isAdmin, isPhotographer } = useAuth();

  // Auto-scroll to top when currentView changes - skip for profile completion to avoid conflicts
  useScrollToTop([currentView], {
    smooth: false,
    skip: currentView === 'complete-profile' || currentView === 'edit-profile'
  });

  const allAvailableTags = useMemo(() => {
    const tagSet = new Set<string>();
    events.forEach(event => {
      event.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [events]);

  // Load initial data - profiles first for faster perceived performance
  useEffect(() => {
    fetchProfiles(); // Critical path - load immediately

    // Load events in background after a short delay
    const eventsTimer = setTimeout(() => {
      fetchCommunities();
    }, 100); // 100ms delay to prioritize profiles

    return () => clearTimeout(eventsTimer);
  }, [fetchProfiles, fetchCommunities]);

  const handleViewProfile = async (profile: Profile) => {
    setSelectedProfile(profile);
    setCurrentView('profile');
  };

  const handleViewCommunity = (community: Community) => {
    setSelectedEvent(community);
    setCurrentView('community');
  };

  const handleBackToDirectory = () => {
    setCurrentView('discover');
    setSelectedProfile(null);
    setSelectedEvent(null);
    // setProfileCompletionId(null);
    window.history.replaceState({}, document.title, window.location.pathname);

    // Ensure scroll to top when going back
    setTimeout(() => window.scrollTo(0, 0), 50);
  };

  const renderCurrentView = () => {
    console.log('=== RENDERING VIEW ===');
    console.log('currentView:', currentView);
    console.log('loading:', loading);

    // Show static shell immediately while data loads - much faster perceived performance
    if (loading && currentView === 'directory') {
      return <DirectoryShell />;
    }

    switch (currentView) {
      case 'slideshow':
        return (
          <PhotoSlideshow
            profiles={profiles}
            events={events}
            onViewProfile={handleViewProfile}
            onOpenApp={() => setCurrentView('discover')}
          />
        );
      case 'discover':
      case 'directory':
        return (
          <Directory
            profiles={profiles}
            searchQuery={searchQuery}
            selectedFilters={selectedFilters}
            onSearchChange={setSearchQuery}
            onFilterToggle={(filter: string) => {
              setSelectedFilters(prev =>
                prev.includes(filter)
                  ? prev.filter(f => f !== filter)
                  : [...prev, filter]
              );
            }}
            onViewProfile={handleViewProfile}
            loading={loading}
          />
        );
      case 'community-list':
        return (
          <CommunityList
            communities={events}
            profiles={profiles}
            onViewCommunity={handleViewCommunity}
            loading={loading}
          />
        );
      case 'user-profile':
        return (
          <UserProfile
            onEditProfile={() => console.log('Edit profile')}
            onNavigate={setCurrentView}
          />
        );
      case 'settings':
        return (
          <Settings
            onNavigate={setCurrentView}
          />
        );
      case 'profile':
        return selectedProfile ? (
          <ProfileView
            profile={selectedProfile}
            onBack={handleBackToDirectory}
            onNavigateToChat={(profileId) => {
              console.log('App: Navigating to chat with profile:', profileId);
              setChatTargetProfileId(profileId);
              setCurrentView('messages');
            }}
          />
        ) : null;
      case 'community':
        return selectedEvent ? (
          <CommunityView
            community={selectedEvent}
            profiles={profiles.filter(p => p.eventId === selectedEvent.id)}
            onBack={handleBackToDirectory}
            onViewProfile={handleViewProfile}
          />
        ) : null;
      case 'admin':
        if (!user || !isAdmin) {
          return <AccessDenied onBack={handleBackToDirectory} />;
        }
        return (
          <Suspense fallback={<LoadingSpinner message="Loading admin dashboard..." />}>
            <AdminDashboard onBack={handleBackToDirectory} />
          </Suspense>
        );
      case 'upload':
        if (!user || !isPhotographer) {
          return <AccessDenied onBack={handleBackToDirectory} />;
        }
        return (
          <Suspense fallback={<LoadingSpinner message="Loading upload interface..." />}>
            <UploadFlow onBack={handleBackToDirectory} fetchProfiles={fetchProfiles} fetchEvents={fetchCommunities} allAvailableTags={allAvailableTags} events={events} />
          </Suspense>
        );
      case 'messages':
        if (!user) {
          return <AccessDenied onBack={handleBackToDirectory} />;
        }
        return (
          <Suspense fallback={<LoadingSpinner message="Loading messages..." />}>
            <ChatPage
              onNavigate={setCurrentView}
              targetProfileId={chatTargetProfileId}
              onTargetHandled={() => setChatTargetProfileId(null)}
            />
          </Suspense>
        );
      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to AI-Friendly Numina</h1>
              <p className="text-xl text-gray-600">Loading...</p>
            </div>
          </div>
        );
    }
  };

  // For slideshow, render fullscreen without header or bottom nav
  if (currentView === 'slideshow') {
    return (
      <div className="min-h-screen bg-black">
        {renderCurrentView()}
      </div>
    );
  }

  // For all other views, use the normal layout with header and bottom navigation
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
      />
      <main className="pt-20 pb-20">
        {renderCurrentView()}
      </main>
      <BottomNavigation
        currentView={currentView}
        onNavigate={setCurrentView}
        unreadMessageCount={0}
      />
    </div>
  );
}