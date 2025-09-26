import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Download, ExternalLink, Play, MapPin, Calendar, Tag, Image, Edit, Heart, MessageCircle } from 'lucide-react';
import { Profile, Question } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../hooks/useData';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { PhotoInteractionBar } from './PhotoInteractionBar';
import { PhotoCommentsModal } from './PhotoCommentsModal';
import { usePhotoInteractions } from '../hooks/usePhotoInteractions';
import { PhotoStats } from '../types/interactions';

interface ProfileViewProps {
  profile: Profile;
  onBack: () => void;
  onNavigateToChat?: (profileId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onBack, onNavigateToChat }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [profileAnswers, setProfileAnswers] = useState(profile.answers || []);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'funfacts' | 'connect'>('story');
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [connectTabEnabled, setConnectTabEnabled] = useState(true);
  const [photoStats, setPhotoStats] = useState<PhotoStats>({ loves: 0, comments: 0, userLoved: false });
  const { user, userProfile, isAdmin, isSuperAdmin } = useAuth();
  const { questions, fetchAnswersByProfileId, formSettings } = useData();
  const { togglePhotoLove, getPhotoStats, loading } = usePhotoInteractions();

  // Scroll to top when ProfileView component mounts or profile changes
  useScrollToTop([profile.id], { smooth: true });

  // Load photo stats when photo changes
  useEffect(() => {
    const loadStats = async () => {
      if (profile.photos[selectedPhotoIndex]) {
        const stats = await getPhotoStats(profile.photos[selectedPhotoIndex], profile.id);
        if (stats) {
          setPhotoStats(stats);
        }
      }
    };
    loadStats();
  }, [selectedPhotoIndex, profile.photos, profile.id, getPhotoStats]);

  // Handle heart/love click
  const handleHeartClick = async () => {
    if (!userProfile) {
      alert('Please log in to like photos');
      return;
    }
    
    if (loading) {
      return; // Silently ignore if loading
    }

    // Optimistic update
    const newUserLoved = !photoStats.userLoved;
    const newLoveCount = photoStats.loves + (newUserLoved ? 1 : -1);
    setPhotoStats(prev => ({
      ...prev,
      userLoved: newUserLoved,
      loves: newLoveCount
    }));

    // Make API call
    const result = await togglePhotoLove(profile.photos[selectedPhotoIndex], profile.id);
    
    if (result && result.success) {
      // Update with actual server response
      setPhotoStats(prev => ({
        ...prev,
        userLoved: result.loved!,
        loves: result.loveCount!
      }));
    } else {
      // Revert on error
      setPhotoStats(prev => ({
        ...prev,
        userLoved: !newUserLoved,
        loves: photoStats.loves
      }));
    }
  };

  // Check if Connect tab is enabled
  useEffect(() => {
    const connectSetting = formSettings?.find(s => s.settingKey === 'connect_tab_enabled');
    if (connectSetting) {
      setConnectTabEnabled(connectSetting.settingValue === 'true');
    }
  }, [formSettings]);

  // Debug profile data
  useEffect(() => {
    console.log('=== PROFILE VIEW DATA DEBUG ===');
    console.log('Profile data:', {
      id: profile.id,
      name: profile.name,
      socialLinks: profile.socialLinks,
      customLinks: profile.customLinks,
      messengerPlatforms: profile.messengerPlatforms,
      hasCustomLinks: profile.customLinks && profile.customLinks.some(link => link.name && link.url),
      hasMessengerPlatforms: profile.messengerPlatforms && Object.values(profile.messengerPlatforms).some(platform => platform)
    });
    console.log('socialLinks detail:', JSON.stringify(profile.socialLinks, null, 2));
    console.log('customLinks detail:', JSON.stringify(profile.customLinks, null, 2));
    console.log('messengerPlatforms detail:', JSON.stringify(profile.messengerPlatforms, null, 2));
  }, [profile]);

  // Load questions directly since useData hook isn't providing them
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        console.log('Loading questions directly in ProfileView...');
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/questions?select=*&is_active=eq.true`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Accept': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const mappedQuestions = data.map(q => ({
            id: q.id,
            category: q.category,
            questionText: q.question_text,
            type: q.type,
            isActive: q.is_active,
            order: q.order
          }));
          setLocalQuestions(mappedQuestions);
          console.log('Questions loaded directly in ProfileView:', mappedQuestions.length);
          console.log('Optional Fun questions:', mappedQuestions.filter(q => q.category === 'Optional Fun').length);
        } else {
          console.error('Failed to fetch questions directly');
        }
      } catch (error) {
        console.error('Error loading questions directly:', error);
      }
    };
    
    loadQuestions();
  }, []);

  // Ensure questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !questionsLoaded) {
      console.log('Questions loaded in ProfileView:', questions.length);
      setQuestionsLoaded(true);
    }
  }, [questions]);

  // Load answers for Fun Facts tab - prevent multiple simultaneous calls
  useEffect(() => {
    const hasAnswers = profile.answers && profile.answers.length > 0;
    
    if (!hasAnswers && !loadingAnswers) {
      console.log('Starting answer loading...');
      setLoadingAnswers(true);
      
      fetchAnswersByProfileId(profile.id)
        .then(answers => {
          console.log('SUCCESS: Loaded answers for profile:', answers?.length || 0);
          setProfileAnswers(answers || []);
          setLoadingAnswers(false);
        })
        .catch(error => {
          console.error('FAILED: Error loading profile answers:', error);
          setProfileAnswers([]);
          setLoadingAnswers(false);
        });
    } else if (hasAnswers) {
      setProfileAnswers(profile.answers);
    }
  }, [profile.id]);

  // Check if the current user owns this profile
  const isOwner = user && (
    user.email === profile.email || 
    userProfile?.email === profile.email
  );

  // Check if user can download photos (owners can download their own, admins/super admins can download any)
  const canDownload = isOwner || isAdmin || isSuperAdmin;
  
  // Debug profile ownership and chat tab visibility
  useEffect(() => {
    console.log('=== CHAT TAB VISIBILITY DEBUG ===');
    console.log('User:', user ? { id: user.id, email: user.email } : 'null');
    console.log('UserProfile:', userProfile ? { id: userProfile.id, email: userProfile.email } : 'null');
    console.log('Profile:', { id: profile.id, email: profile.email, name: profile.name });
    console.log('isOwner:', isOwner);
    console.log('Chat tab should show:', !isOwner && !!user);
  }, [user, userProfile, profile, isOwner]);
  
  // Temporary test: always show edit button for testing
  const showEditForTesting = true;

  const handleEditProfile = () => {
    window.location.href = `/?edit=${profile.id}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} - Numina`,
          text: profile.story.substring(0, 100) + '...',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowShareMenu(false);
  };

  const downloadPhoto = async (photoUrl: string, photoIndex: number) => {
    // Security check: Only profile owners or admins can download photos
    if (!canDownload) {
      alert('You can only download photos from your own profile.');
      return;
    }

    setDownloading(photoIndex);
    try {
      // Fetch the image
      const response = await fetch(photoUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const fileName = `${profile.name.replace(/\s+/g, '_')}_photo_${photoIndex + 1}.jpg`;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading photo:', error);
      alert('Failed to download photo. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const downloadAllPhotos = async () => {
    // Security check: Only profile owners or admins can download photos
    if (!canDownload) {
      alert('You can only download photos from your own profile.');
      return;
    }

    if (profile.photos.length === 0) return;
    
    setDownloading(-1); // Use -1 to indicate "download all" is in progress
    
    try {
      // Download each photo with a small delay to avoid overwhelming the browser
      for (let i = 0; i < profile.photos.length; i++) {
        await downloadPhoto(profile.photos[i], i);
        // Small delay between downloads
        if (i < profile.photos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error downloading photos:', error);
    } finally {
      setDownloading(null);
    }
  };

  const handlePhotoShare = async () => {
    const currentPhotoUrl = profile.photos[selectedPhotoIndex];
    const shareData = {
      title: `${profile.name}'s photo`,
      text: `Check out this photo from ${profile.name}'s profile on Numina`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying link
      try {
        await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        // Final fallback - show share URL in prompt
        prompt('Copy this link to share:', `${shareData.text} - ${shareData.url}`);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Directory</span>
            </button>
            
            <div className="flex items-center space-x-3">
              {(isOwner || showEditForTesting) && (
                <button
                  onClick={handleEditProfile}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              )}
              
              
              <div className="relative">
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
                
                {showShareMenu && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-48 z-10">
                    <button
                      onClick={() => copyToClipboard(window.location.href)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      Copy link
                    </button>
                    <button
                      onClick={() => copyToClipboard(`Check out ${profile.name}'s story: ${window.location.href}`)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      Copy with message
                    </button>
                  </div>
                )}
              </div>
              
              {canDownload && (
                <div className="relative">
                  <button 
                    onClick={downloadAllPhotos}
                    disabled={downloading !== null}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" />
                    <span>
                      {downloading === -1 ? 'Downloading...' : `Download All (${profile.photos.length})`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Photo Section */}
          <div className="space-y-4">
            <div className="relative">
              {/* Photo Download Button */}
              {canDownload && (
                <button
                  onClick={() => downloadPhoto(profile.photos[selectedPhotoIndex], selectedPhotoIndex)}
                  disabled={downloading === selectedPhotoIndex}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-lg transition-all duration-200 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download this photo"
                >
                  {downloading === selectedPhotoIndex ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </button>
              )}

              <div className="w-full bg-gray-100 rounded-xl shadow-lg overflow-hidden" style={{ aspectRatio: '4/5' }}>
                <img
                  src={profile.photos[selectedPhotoIndex]}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    const container = img.parentElement;
                    if (container && img.naturalWidth && img.naturalHeight) {
                      const aspectRatio = img.naturalWidth / img.naturalHeight;
                      container.style.aspectRatio = aspectRatio < 1 ? '4/5' : '16/10';
                    }
                  }}
                />
                
                {/* Overlay Photo Interactions - Bottom Center */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 z-30">
                  <div className="flex items-center space-x-6 bg-black/60 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
                    {/* Heart button */}
                    <button
                      onClick={handleHeartClick}
                      className="text-white hover:text-gray-200 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Heart 
                        className={`h-6 w-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] stroke-2 transition-colors ${
                          photoStats.userLoved ? 'fill-red-500 text-red-500' : 'text-white'
                        }`}
                      />
                      {photoStats.loves > 0 && (
                        <span className="text-sm text-white">{photoStats.loves}</span>
                      )}
                    </button>

                    {/* Comments button */}
                    <button
                      onClick={() => setShowCommentsModal(true)}
                      className="text-white hover:text-gray-200 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <MessageCircle className="h-6 w-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] stroke-2" />
                      {photoStats.comments > 0 && (
                        <span className="text-sm text-white">{photoStats.comments}</span>
                      )}
                    </button>
                    
                    {/* Share button */}
                    <button
                      onClick={handlePhotoShare}
                      className="text-white hover:text-gray-200 transition-colors duration-200"
                    >
                      <Share2 className="h-6 w-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] stroke-2" />
                    </button>
                  </div>
                </div>

                {/* Floating Chat Button - Positioned within the photo container */}
                {user && !isOwner && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Chat button clicked for profile:', profile.id);
                      
                      // Add immediate visual feedback for iOS
                      const button = e.currentTarget;
                      button.style.transform = 'scale(0.9)';
                      button.style.opacity = '0.8';
                      
                      // Use requestAnimationFrame for smoother transition on iOS
                      requestAnimationFrame(() => {
                        // Use callback if provided, otherwise fallback to URL navigation
                        if (onNavigateToChat) {
                          onNavigateToChat(profile.id);
                        } else {
                          // Fallback to URL navigation
                          window.location.href = `/?view=messages&with=${profile.id}`;
                        }
                      });
                    }}
                    className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer active:scale-90 active:opacity-80"
                    style={{ 
                      zIndex: 200,
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                    title={`Message ${profile.name}`}
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                )}
                
              </div>
{/* Temporarily disabled video overlay to test button clicks
              {profile.videoUrl && selectedPhotoIndex === 0 && (
                <button className="absolute inset-x-0 inset-y-8 flex items-center justify-center group z-10">
                  <div className="bg-black/20 rounded-full p-6 group-hover:bg-black/30 transition-colors backdrop-blur-sm">
                    <div className="bg-white/90 rounded-full p-4 group-hover:bg-white transition-colors">
                      <Play className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </button>
              )}
              */}
            </div>
            
            {profile.photos.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {profile.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group flex-shrink-0"
                  >
                    <button
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPhotoIndex === index
                          ? 'border-purple-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`${profile.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    
                    {/* Individual photo download button */}
                    {canDownload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPhoto(photo, index);
                        }}
                        disabled={downloading === index}
                        className="absolute -top-2 -right-2 bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Download photo ${index + 1}`}
                      >
                        {downloading === index ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            
            {/* Photo Info and Actions */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Photo {selectedPhotoIndex + 1} of {profile.photos.length}
              </span>
              {canDownload && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => downloadPhoto(profile.photos[selectedPhotoIndex], selectedPhotoIndex)}
                    disabled={downloading === selectedPhotoIndex}
                    className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Image className="h-4 w-4" />
                    <span>
                      {downloading === selectedPhotoIndex ? 'Downloading...' : 'Download Original'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
              <p className="text-xl text-purple-600 mb-4">{profile.role}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Created {new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
                {profile.updatedAt && profile.updatedAt !== profile.createdAt && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Updated {new Date(profile.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('story')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'story'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } transition-colors`}
                >
                  Story
                </button>
                <button
                  onClick={() => setActiveTab('funfacts')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'funfacts'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } transition-colors`}
                >
                  Fun Facts
                </button>
                {connectTabEnabled && (
                  <button
                    onClick={() => setActiveTab('connect')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'connect'
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } transition-colors`}
                  >
                    Connect
                  </button>
                )}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'story' ? (
              <div className="space-y-6 pt-6">
                {/* Story */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Story</h2>
                  <div className="prose prose-gray max-w-none">
                    <div 
                      className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: (() => {
                          let formatted = profile.story;
                          // Replace bold markers
                          formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                          // Replace italic markers (but not the ones that were part of bold)
                          formatted = formatted.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
                          // Replace line breaks
                          formatted = formatted.replace(/\n/g, '<br />');
                          return formatted;
                        })()
                      }}
                    />
                  </div>
                </div>

                {/* Tags */}
                {profile.tags.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Tags
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Section */}
                {profile.videoUrl && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Video Story</h2>
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Play className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Video player would be embedded here</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'funfacts' ? (
              <div className="space-y-6 pt-6">
                {/* Fun Facts */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Fun Facts</h2>
                  <div className="space-y-3">
                    {loadingAnswers ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading fun facts...</p>
                      </div>
                    ) : (
                      (() => {
                        console.log('=== FUN FACTS FILTERING DEBUG ===');
                        console.log('profileAnswers count:', profileAnswers?.length || 0);
                        console.log('questions count (useData):', questions?.length || 0);
                        console.log('localQuestions count:', localQuestions?.length || 0);
                        console.log('profileAnswers:', profileAnswers);
                        console.log('localQuestions sample:', localQuestions?.slice(0, 3));
                        
                        // Use localQuestions since questions from useData is empty
                        const questionsToUse = localQuestions.length > 0 ? localQuestions : questions;
                        
                        const filteredAnswers = profileAnswers
                          ?.filter(answer => {
                            const question = questionsToUse.find(q => q.id === answer.questionId);
                            const isOptionalFun = question?.category === 'Optional Fun';
                            const hasText = answer.answerText?.trim();
                            
                            console.log(`Answer ${answer.questionId}:`, {
                              questionFound: !!question,
                              questionCategory: question?.category,
                              isOptionalFun,
                              hasText,
                              answerText: answer.answerText,
                              questionText: question?.questionText
                            });
                            
                            return isOptionalFun && hasText;
                          })
                          .map(answer => {
                            const question = questionsToUse.find(q => q.id === answer.questionId);
                            return { ...answer, question };
                          })
                          .filter(item => item.question);
                          
                        console.log('Filtered Optional Fun answers:', filteredAnswers);
                        console.log('Final count for display:', filteredAnswers?.length || 0);
                        
                        return filteredAnswers?.map((item, index) => (
                          <div key={item.id || index} className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm font-medium text-gray-900 mb-2">
                              {item.question?.questionText}
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {item.answerText}
                            </p>
                          </div>
                        ));
                      })()
                    )}
                    {!loadingAnswers && profileAnswers?.filter(answer => {
                      const questionsToUse = localQuestions.length > 0 ? localQuestions : questions;
                      const question = questionsToUse.find(q => q.id === answer.questionId);
                      return question?.category === 'Optional Fun' && answer.answerText?.trim();
                    }).length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                          <span className="text-4xl">🎯</span>
                        </div>
                        <p className="text-gray-500">No fun facts available yet.</p>
                        <p className="text-sm text-gray-400 mt-2">Check back later for interesting tidbits!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'connect' && connectTabEnabled ? (
              <div className="space-y-6 pt-6">
                {/* Social Links */}
                {Object.keys(profile.socialLinks).some(key => profile.socialLinks[key]) && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Social Media</h2>
                    <div className="flex flex-wrap gap-3">
                      {profile.socialLinks.linkedin && (
                        <a
                          href={profile.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {profile.socialLinks.instagram && (
                        <a
                          href={profile.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Instagram</span>
                        </a>
                      )}
                      {profile.socialLinks.twitter && (
                        <a
                          href={profile.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Twitter</span>
                        </a>
                      )}
                      {profile.socialLinks.youtube && (
                        <a
                          href={profile.socialLinks.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>YouTube</span>
                        </a>
                      )}
                      {profile.socialLinks.facebook && (
                        <a
                          href={profile.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Facebook</span>
                        </a>
                      )}
                      {profile.socialLinks.website && (
                        <a
                          href={profile.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom Links */}
                {profile.customLinks && profile.customLinks.some(link => link.name && link.url) && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Links</h2>
                    <div className="space-y-2">
                      {profile.customLinks
                        .filter(link => link.name && link.url)
                        .map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="font-medium text-gray-900">{link.name}</span>
                            <ExternalLink className="h-4 w-4 text-gray-500" />
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {/* Messenger Platforms */}
                {profile.messengerPlatforms && Object.values(profile.messengerPlatforms).some(platform => platform) && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Message Me</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {profile.messengerPlatforms.whatsapp && (
                        <a
                          href={profile.messengerPlatforms.whatsapp.startsWith('http') 
                            ? profile.messengerPlatforms.whatsapp 
                            : `https://wa.me/${profile.messengerPlatforms.whatsapp.replace(/[^\d]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <span>📱</span>
                          <span>WhatsApp</span>
                        </a>
                      )}
                      {profile.messengerPlatforms.telegram && (
                        <a
                          href={profile.messengerPlatforms.telegram.startsWith('http') 
                            ? profile.messengerPlatforms.telegram 
                            : `https://t.me/${profile.messengerPlatforms.telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <span>✈️</span>
                          <span>Telegram</span>
                        </a>
                      )}
                      {profile.messengerPlatforms.wechat && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white text-sm rounded-lg">
                          <span>💬</span>
                          <span>WeChat: {profile.messengerPlatforms.wechat}</span>
                        </div>
                      )}
                      {profile.messengerPlatforms.line && (
                        <a
                          href={profile.messengerPlatforms.line.startsWith('http') 
                            ? profile.messengerPlatforms.line 
                            : `https://line.me/ti/p/${profile.messengerPlatforms.line}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-3 py-2 bg-green-400 text-white text-sm rounded-lg hover:bg-green-500 transition-colors"
                        >
                          <span>📞</span>
                          <span>Line</span>
                        </a>
                      )}
                      {profile.messengerPlatforms.signal && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg">
                          <span>🔒</span>
                          <span>Signal: {profile.messengerPlatforms.signal}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Empty State for Connect Tab */}
                {!Object.keys(profile.socialLinks).some(key => profile.socialLinks[key]) && 
                 (!profile.customLinks || !profile.customLinks.some(link => link.name && link.url)) && 
                 (!profile.messengerPlatforms || !Object.values(profile.messengerPlatforms).some(platform => platform)) && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <ExternalLink className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Connection Info</h3>
                    <p className="text-gray-500 mb-2">This profile hasn't added any social links, custom links, or messaging platforms yet.</p>
                    <p className="text-sm text-gray-400">Check back later or encourage them to complete their profile!</p>
                  </div>
                )}
              </div>
            ) : (
              // Fallback to Story tab if Connect is selected but disabled
              <div className="space-y-6 pt-6">
                {/* This should not happen, but as a safety fallback */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Comments Modal */}
      <PhotoCommentsModal
        photoUrl={profile.photos[selectedPhotoIndex]}
        profileId={profile.id}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        onStatsUpdate={(loves, comments) => {
          // This could be used to update parent component state if needed
          console.log(`Photo stats updated: ${loves} loves, ${comments} comments`);
        }}
      />
    </div>
  );
};