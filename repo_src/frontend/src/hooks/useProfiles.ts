import { useState, useCallback, useEffect } from 'react';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { fetchProfilesListRobust } from '../utils/robustQuery';
import { profileEvents } from '../utils/profileEvents';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchProfiles = useCallback(async (forceRefresh = false): Promise<Profile[]> => {
    // Prevent rapid repeated fetches
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 1000) {
      console.log('useProfiles: Skipping fetch, too soon after last fetch');
      return profiles; // Return current profiles if skipping
    }

    console.log('=== FETCHING PROFILES - DIRECT MODE ===');
    setLoading(true);
    setLastFetchTime(now);
    
    try {
      // Check if we have a valid session with timeout to prevent hanging
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 3000)
      );
      
      let session = null;
      try {
        const result = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: any } };
        session = result.data.session;
        console.log('useProfiles: Session status:', session ? 'valid' : 'no session');
      } catch (sessionError) {
        console.warn('useProfiles: Session check failed or timed out, continuing anyway:', sessionError);
      }
      
      // Add a small delay to avoid race conditions with profile updates
      if (forceRefresh) {
        console.log('useProfiles: Force refresh requested, adding delay...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay for force refresh
      }

      // Direct Supabase query - bypass robust query for now
      // Filter at database level for better performance
      // Add timeout to prevent hanging
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('has_completed_profile', true)
        .eq('is_public', true)
        .eq('published_profile', true)
        .order('created_at', { ascending: false });
      
      const queryTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 5000)
      );
      
      const { data, error } = await Promise.race([
        queryPromise,
        queryTimeoutPromise
      ]) as { data: any, error: any };

      if (error) {
        console.error('useProfiles: Direct query error:', error);
        throw error;
      }

      const profilesData = data || [];
      console.log(`useProfiles: Direct query returned ${profilesData.length} profiles`);
      
      // Log the raw data to debug
      profilesData.forEach(p => {
        console.log(`Profile ${p.name}: completed=${p.has_completed_profile}, public=${p.is_public}, published=${p.published_profile}`);
      });
      
      // Filter for public profiles - must have ALL three flags true
      const publicProfiles = profilesData.filter(p => {
        const shouldInclude = p.is_public === true && 
                             p.published_profile === true && 
                             p.has_completed_profile === true;
        if (!shouldInclude) {
          console.log(`Excluding profile ${p.name}: completed=${p.has_completed_profile}, public=${p.is_public}, published=${p.published_profile}`);
        }
        return shouldInclude;
      });
      
      console.log(`useProfiles: Filtered to ${publicProfiles.length} public profiles`);

      const mappedProfiles = publicProfiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        story: profile.story,
        coverPhoto: profile.cover_photo,
        photos: [], // Load photos separately on demand
        mainPhoto: profile.main_photo,
        socialLinks: profile.social_links || {},
        customLinks: profile.custom_links || [],
        messengerPlatforms: profile.messenger_platforms || {},
        tags: profile.tags || [], // Now loading tags from database
        eventId: profile.event_id,
        location: profile.location,
        isPublic: profile.is_public,
        hasCompletedProfile: profile.has_completed_profile,
        videoUrl: profile.video_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }));

      console.log(`useProfiles: Successfully mapped ${mappedProfiles.length} profiles`);
      
      // Enhanced fallback logic for newly completed profiles
      if (mappedProfiles.length === 0 || (profiles.length > 0 && mappedProfiles.length < profiles.length)) {
        console.warn('useProfiles: Potentially missing profiles, retrying with broader query...');
        
        // Add extra delay for database consistency on retries
        if (forceRefresh) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const { data: retryData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (retryData && retryData.length > 0) {
          const visibleProfiles = retryData.filter(p => 
            p.is_public === true && 
            p.published_profile === true && 
            p.has_completed_profile === true
          );
          
          if (visibleProfiles.length > 0) {
            console.log(`useProfiles: Retry found ${visibleProfiles.length} visible profiles`);
            const retryMapped = visibleProfiles.map(profile => ({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              story: profile.story,
              coverPhoto: profile.cover_photo,
              photos: [],
              mainPhoto: profile.main_photo,
              socialLinks: profile.social_links || {},
              customLinks: profile.custom_links || [],
              messengerPlatforms: profile.messenger_platforms || {},
              tags: profile.tags || [],
              eventId: profile.event_id,
              location: profile.location,
              isPublic: profile.is_public,
              hasCompletedProfile: profile.has_completed_profile,
              videoUrl: profile.video_url,
              createdAt: profile.created_at,
              updatedAt: profile.updated_at
            }));
            setProfiles(retryMapped);
            setLoading(false);
            console.log('useProfiles: Profiles fetch completed');
            return retryMapped;
          }
        }
      }
      
      setProfiles(mappedProfiles);
      setLoading(false);
      console.log('useProfiles: Profiles fetch completed');
      return mappedProfiles;
    } catch (error) {
      console.error('useProfiles: Error fetching profiles:', error);
      
      // Fallback: try simpler query
      try {
        console.log('useProfiles: Trying simpler fallback query...');
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select('*')
          .eq('has_completed_profile', true)
          .eq('is_public', true)
          .eq('published_profile', true)
          .limit(50);
          
        if (fallbackData && fallbackData.length > 0) {
          const simplifiedProfiles = fallbackData
            .filter(p => p.is_public && p.published_profile)
            .map(p => ({
              id: p.id,
              name: p.name,
              email: p.email,
              role: p.role,
              story: '',
              coverPhoto: p.main_photo || '',
              photos: [],
              mainPhoto: p.main_photo || '',
              socialLinks: {},
              customLinks: [],
              messengerPlatforms: {},
              tags: [],
              eventId: null,
              location: '',
              isPublic: true,
              hasCompletedProfile: true,
              videoUrl: '',
              createdAt: '',
              updatedAt: ''
            }));
          
          console.log(`useProfiles: Fallback query returned ${simplifiedProfiles.length} profiles`);
          setProfiles(simplifiedProfiles);
          setLoading(false);
          return simplifiedProfiles;
        } else {
          setProfiles([]);
          setLoading(false);
          return [];
        }
      } catch (fallbackError) {
        console.error('useProfiles: Fallback query also failed:', fallbackError);
        setProfiles([]);
        setLoading(false);
        return [];
      }
    }
  }, [profiles, lastFetchTime]);

  const fetchProfilePhotos = useCallback(async (profileId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('photos')
        .eq('id', profileId)
        .single();

      if (error) {
        throw error;
      }

      return data?.photos || [];
    } catch (error) {
      console.error('Error fetching profile photos:', error);
      return [];
    }
  }, []);

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('useProfiles: Profile update event received, refreshing...');
      // Add delay to ensure database consistency
      setTimeout(() => fetchProfiles(true), 1000);
    };

    const handleVisibilityChange = () => {
      console.log('useProfiles: Profile visibility change event received, refreshing...');
      // Add extra delay for visibility changes to ensure database consistency
      setTimeout(() => fetchProfiles(true), 2500);
    };

    const unsubUpdate = profileEvents.onProfileUpdate(handleProfileUpdate);
    const unsubVisibility = profileEvents.onProfileVisibilityChange(handleVisibilityChange);

    return () => {
      unsubUpdate();
      unsubVisibility();
    };
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    fetchProfiles,
    fetchProfilePhotos,
    setProfiles
  };
};