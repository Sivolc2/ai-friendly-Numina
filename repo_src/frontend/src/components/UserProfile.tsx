import React, { useState, useEffect, useCallback } from 'react';
import { Edit3, Camera, MapPin, Calendar, Mail, ExternalLink, MessageCircle, User, Eye, Users, Globe } from 'lucide-react';
import { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { supabase } from '../lib/supabase';
import { profileEvents } from '../utils/profileEvents';

interface UserProfileProps {
  onEditProfile: () => void;
  onNavigate: (view: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onEditProfile,
  onNavigate
}) => {
  const { user, userProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  
  // Define visibility states
  type VisibilityState = 'private' | 'loops_only' | 'public';
  const [visibility, setVisibility] = useState<VisibilityState>('private');

  useScrollToTop([], { smooth: false });

  // Toggle visibility between states
  const toggleVisibility = async () => {
    if (!profile || updatingVisibility) return;
    
    setUpdatingVisibility(true);
    
    // Cycle through states: private -> loops_only -> public -> private
    const nextState: VisibilityState = 
      visibility === 'private' ? 'loops_only' :
      visibility === 'loops_only' ? 'public' : 'private';
    
    try {
      // Update database
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (nextState === 'private') {
        updateData.is_public = false;
        updateData.published_profile = false;
        updateData.loops_only = false;
      } else if (nextState === 'loops_only') {
        updateData.is_public = false;
        updateData.published_profile = false;
        updateData.loops_only = true;
      } else { // public
        updateData.is_public = true;
        updateData.published_profile = true;
        updateData.loops_only = false;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);
      
      if (error) throw error;
      
      // Update local state
      setVisibility(nextState);
      setProfile(prev => prev ? {
        ...prev,
        isPublic: nextState === 'public'
      } : null);
      
      // Emit event for other components to refresh
      profileEvents.emitProfileVisibilityChange();
      
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Failed to update profile visibility');
    } finally {
      setUpdatingVisibility(false);
    }
  };

  const fetchFullProfile = useCallback(async (profileId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;

      if (data) {
        const fullProfile: Profile = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          story: data.story || '',
          coverPhoto: data.cover_photo || '',
          photos: data.photos || [],
          mainPhoto: data.main_photo || '',
          socialLinks: data.social_links || {},
          customLinks: data.custom_links || [],
          messengerPlatforms: data.messenger_platforms || {},
          tags: data.tags || [],
          eventId: data.event_id,
          location: data.location || '',
          isPublic: data.is_public,
          hasCompletedProfile: data.has_completed_profile,
          videoUrl: data.video_url || '',
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        setProfile(fullProfile);
        setError(null);
        
        // Set visibility state based on profile data
        // For now, we'll use is_public flag, later we'll add loops_only support
        if (data.is_public && data.published_profile) {
          setVisibility('public');
        } else if (data.loops_only) {  // This field will be added to database
          setVisibility('loops_only');
        } else {
          setVisibility('private');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfileByEmail = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      if (data) {
        fetchFullProfile(data.id);
      }
    } catch (error) {
      console.error('Error fetching profile by email:', error);
      setError('Failed to find profile');
      setLoading(false);
    }
  }, [fetchFullProfile]);

  useEffect(() => {
    if (userProfile) {
      fetchFullProfile(userProfile.id);
    } else if (user) {
      // Try to find profile by email if userProfile is not available
      fetchProfileByEmail(user.email);
    } else {
      setLoading(false);
    }
  }, [user, userProfile, fetchFullProfile, fetchProfileByEmail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-300 rounded mb-2 w-48"></div>
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading profile</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
            <p className="text-gray-500 mb-4">
              We couldn't find your profile. You may need to complete your profile setup.
            </p>
            <button
              onClick={onEditProfile}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasMainPhoto = profile.mainPhoto && profile.mainPhoto !== '';
  const mainPhotoUrl = hasMainPhoto ? profile.mainPhoto : (profile.photos?.[0] || '');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {mainPhotoUrl ? (
                    <img
                      src={mainPhotoUrl}
                      alt={profile.name}
                      className="w-20 h-20 rounded-full object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-purple-600" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <p className="text-lg text-gray-600">{profile.role}</p>
                  {profile.location && (
                    <div className="flex items-center space-x-1 text-gray-500 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={onEditProfile}
                className="flex items-center space-x-2 px-3 py-2 text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {profile.photos?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Photos</div>
              </div>
              <div className="text-center">
                <button
                  onClick={toggleVisibility}
                  disabled={updatingVisibility}
                  className={`group relative px-4 py-2 rounded-lg transition-all duration-200 ${
                    updatingVisibility ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
                  } ${
                    visibility === 'private' ? 'bg-gray-100 hover:bg-gray-200' :
                    visibility === 'loops_only' ? 'bg-blue-100 hover:bg-blue-200' :
                    'bg-green-100 hover:bg-green-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {visibility === 'private' ? (
                      <Eye className="h-5 w-5 text-gray-600" />
                    ) : visibility === 'loops_only' ? (
                      <Users className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Globe className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <div className={`text-lg font-semibold ${
                        visibility === 'private' ? 'text-gray-900' :
                        visibility === 'loops_only' ? 'text-blue-900' :
                        'text-green-900'
                      }`}>
                        {visibility === 'private' ? 'Private' :
                         visibility === 'loops_only' ? 'Loops Only' :
                         'Public'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {visibility === 'loops_only' && 'Events & communities you belong to'}
                    {visibility === 'private' && 'Only you can see'}
                    {visibility === 'public' && 'Everyone can see'}
                  </div>
                </button>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">
                  {profile.createdAt ? new Date(profile.createdAt).getFullYear() : '—'}
                </div>
                <div className="text-sm text-gray-500">Member Since</div>
              </div>
            </div>
          </div>
        </div>

        {/* Story Section */}
        {profile.story && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">My Story</h2>
              <p className="text-gray-700 leading-relaxed">{profile.story}</p>
            </div>
          </div>
        )}

        {/* Social Links */}
        {(Object.keys(profile.socialLinks || {}).length > 0 || (profile.customLinks && profile.customLinks.length > 0)) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Links</h2>
              <div className="space-y-3">
                {Object.entries(profile.socialLinks || {}).map(([platform, url]) => {
                  if (!url) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 text-gray-700 hover:text-purple-600 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="capitalize">{platform}</span>
                    </a>
                  );
                })}
                
                {profile.customLinks?.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 text-gray-700 hover:text-purple-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{link.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact Methods */}
        {Object.keys(profile.messengerPlatforms || {}).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Me</h2>
              <div className="space-y-3">
                {Object.entries(profile.messengerPlatforms || {}).map(([platform, handle]) => {
                  if (!handle) return null;
                  return (
                    <div key={platform} className="flex items-center space-x-3 text-gray-700">
                      <MessageCircle className="h-4 w-4" />
                      <span className="capitalize">{platform}: {handle}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {profile.photos && profile.photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {profile.photos.map((photo, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg bg-gray-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Account Information & Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {profile.name || 'Name not set'}
                    </div>
                    <div className="text-sm text-gray-500">Display name</div>
                  </div>
                </div>
                <button
                  onClick={onEditProfile}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-700 py-2">
                <Mail className="h-4 w-4" />
                <div>
                  <div className="font-medium">{profile.email}</div>
                  <div className="text-sm text-gray-500">Email address</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-700 py-2">
                <Calendar className="h-4 w-4" />
                <div>
                  <div className="font-medium">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">Member since</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={onEditProfile}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};