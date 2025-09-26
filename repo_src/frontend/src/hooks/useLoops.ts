import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Loop, 
  Community, 
  LoopEvent, 
  CommunityMember,
  CommunityPhoto,
  ActivityItem,
  ModuleType 
} from '../types/loops';

export const useLoops = () => {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [currentLoop, setCurrentLoop] = useState<Loop | null>(null);
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, isSuperAdmin } = useAuth();

  // Fetch all loops accessible to the current user
  const fetchLoops = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('loops')
        .select(`
          *,
          organizer:profiles!organizer_id(id, name, email)
        `);

      // If not super admin, filter to accessible loops
      if (!isSuperAdmin) {
        query = query.or(`is_public.eq.true,organizer_id.eq.${user?.id}`);
        
        if (user) {
          // Also include loops where user is a member
          const { data: memberLoops } = await supabase
            .from('loop_members')
            .select('loop_id')
            .eq('profile_id', user.id);
          
          if (memberLoops && memberLoops.length > 0) {
            const loopIds = memberLoops.map(m => m.loop_id);
            query = query.or(`id.in.(${loopIds.join(',')})`);
          }
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const mappedLoops: Loop[] = (data || []).map(loop => ({
        id: loop.id,
        name: loop.name,
        description: loop.description,
        slug: loop.slug,
        coverImage: loop.cover_image,
        logoImage: loop.logo_image,
        organizerId: loop.organizer_id,
        organizationName: loop.organization_name,
        modulesEnabled: loop.modules_enabled || ['events', 'community'],
        primaryColor: loop.primary_color,
        secondaryColor: loop.secondary_color,
        memberCount: loop.member_count,
        eventCount: loop.event_count,
        communityCount: loop.community_count,
        isActive: loop.is_active,
        isPublic: loop.is_public,
        createdAt: loop.created_at,
        updatedAt: loop.updated_at,
        organizer: loop.organizer
      }));

      setLoops(mappedLoops);
      return mappedLoops;
    } catch (error) {
      console.error('Error fetching loops:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, isSuperAdmin]);

  // Fetch communities for a specific loop
  const fetchCommunities = useCallback(async (loopId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          loop:loops!loop_id(id, name, slug)
        `)
        .eq('loop_id', loopId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedCommunities: Community[] = (data || []).map(community => ({
        id: community.id,
        loopId: community.loop_id,
        name: community.name,
        description: community.description,
        slug: community.slug,
        coverImage: community.cover_image,
        startDate: community.start_date,
        meetingFrequency: community.meeting_frequency,
        meetingDay: community.meeting_day,
        meetingTime: community.meeting_time,
        meetingLocation: community.meeting_location,
        onlineLink: community.online_link,
        memberCount: community.member_count,
        activeMembers: community.active_members,
        totalPhotos: community.total_photos,
        discussionCount: community.discussion_count,
        isPrivate: community.is_private,
        requiresApproval: community.requires_approval,
        membershipFee: community.membership_fee,
        tags: community.tags || [],
        createdAt: community.created_at,
        updatedAt: community.updated_at,
        createdBy: community.created_by,
        loop: community.loop
      }));

      setCommunities(mappedCommunities);
      return mappedCommunities;
    } catch (error) {
      console.error('Error fetching communities:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new loop
  const createLoop = async (loopData: {
    name: string;
    description: string;
    slug: string;
    organizationName?: string;
    coverImage?: string;
    logoImage?: string;
    modulesEnabled?: ModuleType[];
    isPublic?: boolean;
  }) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      // Check if slug is unique
      const { data: existingLoop } = await supabase
        .from('loops')
        .select('id')
        .eq('slug', loopData.slug)
        .single();

      if (existingLoop) {
        throw new Error('A loop with this URL slug already exists');
      }

      const { data, error } = await supabase
        .from('loops')
        .insert([{
          name: loopData.name,
          description: loopData.description,
          slug: loopData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          cover_image: loopData.coverImage,
          logo_image: loopData.logoImage,
          organizer_id: user.id,
          organization_name: loopData.organizationName,
          modules_enabled: loopData.modulesEnabled || ['events', 'community'],
          is_public: loopData.isPublic ?? true
        }])
        .select()
        .single();

      if (error) throw error;

      // Add creator as loop owner
      await supabase
        .from('loop_members')
        .insert([{
          loop_id: data.id,
          profile_id: user.id,
          role: 'owner'
        }]);

      await fetchLoops();
      return data;
    } catch (error) {
      console.error('Error creating loop:', error);
      throw error;
    }
  };

  // Create a new community within a loop
  const createCommunity = async (communityData: {
    loopId: string;
    name: string;
    description: string;
    slug: string;
    coverImage?: string;
    meetingFrequency?: string;
    meetingDay?: string;
    meetingTime?: string;
    meetingLocation?: string;
    onlineLink?: string;
    isPrivate?: boolean;
    requiresApproval?: boolean;
    tags?: string[];
  }) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { data, error } = await supabase
        .from('communities')
        .insert([{
          loop_id: communityData.loopId,
          name: communityData.name,
          description: communityData.description,
          slug: communityData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          cover_image: communityData.coverImage,
          meeting_frequency: communityData.meetingFrequency,
          meeting_day: communityData.meetingDay,
          meeting_time: communityData.meetingTime,
          meeting_location: communityData.meetingLocation,
          online_link: communityData.onlineLink,
          is_private: communityData.isPrivate ?? false,
          requires_approval: communityData.requiresApproval ?? false,
          tags: communityData.tags || [],
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Add creator as community admin
      await supabase
        .from('community_members')
        .insert([{
          community_id: data.id,
          profile_id: user.id,
          role: 'admin'
        }]);

      await fetchCommunities(communityData.loopId);
      return data;
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  };

  // Join a community
  const joinCommunity = async (communityId: string) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { error } = await supabase
        .from('community_members')
        .insert([{
          community_id: communityId,
          profile_id: user.id,
          role: 'member'
        }]);

      if (error) throw error;

      // Log activity
      await logActivity(communityId, 'joined');
      
      return true;
    } catch (error) {
      console.error('Error joining community:', error);
      throw error;
    }
  };

  // Leave a community
  const leaveCommunity = async (communityId: string) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('profile_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error;
    }
  };

  // Upload photo to community
  const uploadCommunityPhoto = async (
    communityId: string,
    photoUrl: string,
    caption?: string,
    eventId?: string
  ) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { data, error } = await supabase
        .from('community_photos')
        .insert([{
          community_id: communityId,
          profile_id: user.id,
          photo_url: photoUrl,
          caption: caption,
          event_id: eventId
        }])
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity(communityId, 'posted_photo', 'photo', data.id, caption || 'New photo');

      return data;
    } catch (error) {
      console.error('Error uploading community photo:', error);
      throw error;
    }
  };

  // Get community members
  const getCommunityMembers = async (communityId: string): Promise<CommunityMember[]> => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          *,
          profile:profiles!profile_id(id, name, email, main_photo)
        `)
        .eq('community_id', communityId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(member => ({
        id: member.id,
        communityId: member.community_id,
        profileId: member.profile_id,
        role: member.role,
        joinedAt: member.joined_at,
        lastActiveAt: member.last_active_at,
        eventsAttended: member.events_attended,
        photosShared: member.photos_shared,
        discussionsStarted: member.discussions_started,
        commentsPosted: member.comments_posted,
        isActive: member.is_active,
        isBanned: member.is_banned,
        banReason: member.ban_reason,
        profile: member.profile
      }));
    } catch (error) {
      console.error('Error fetching community members:', error);
      return [];
    }
  };

  // Get community photos
  const getCommunityPhotos = async (communityId: string): Promise<CommunityPhoto[]> => {
    try {
      const { data, error } = await supabase
        .from('community_photos')
        .select(`
          *,
          profile:profiles!profile_id(id, name, main_photo)
        `)
        .eq('community_id', communityId)
        .eq('is_approved', true)
        .order('uploaded_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(photo => ({
        id: photo.id,
        communityId: photo.community_id,
        profileId: photo.profile_id,
        eventId: photo.event_id,
        photoUrl: photo.photo_url,
        thumbnailUrl: photo.thumbnail_url,
        caption: photo.caption,
        likeCount: photo.like_count,
        commentCount: photo.comment_count,
        uploadedAt: photo.uploaded_at,
        isApproved: photo.is_approved,
        isFeatured: photo.is_featured,
        profile: photo.profile
      }));
    } catch (error) {
      console.error('Error fetching community photos:', error);
      return [];
    }
  };

  // Get activity feed for a community
  const getActivityFeed = async (communityId: string): Promise<ActivityItem[]> => {
    try {
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(activity => ({
        id: activity.id,
        communityId: activity.community_id,
        actorId: activity.actor_id,
        actorName: activity.actor_name,
        activityType: activity.activity_type,
        targetType: activity.target_type,
        targetId: activity.target_id,
        targetTitle: activity.target_title,
        createdAt: activity.created_at
      }));
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }
  };

  // Log activity to feed
  const logActivity = async (
    communityId: string,
    activityType: string,
    targetType?: string,
    targetId?: string,
    targetTitle?: string
  ) => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      await supabase
        .from('activity_feed')
        .insert([{
          community_id: communityId,
          actor_id: user.id,
          actor_name: profile?.name || 'Unknown',
          activity_type: activityType,
          target_type: targetType,
          target_id: targetId,
          target_title: targetTitle
        }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Check if user is member of a community
  const isCommunityMember = async (communityId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('profile_id', user.id)
        .single();

      return !!data;
    } catch {
      return false;
    }
  };

  // Update community member role
  const updateMemberRole = async (
    communityId: string,
    profileId: string,
    newRole: 'admin' | 'moderator' | 'member' | 'guest'
  ) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: newRole })
        .eq('community_id', communityId)
        .eq('profile_id', profileId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  };

  // Initialize on mount
  useEffect(() => {
    fetchLoops();
  }, [fetchLoops]);

  return {
    loops,
    communities,
    currentLoop,
    currentCommunity,
    loading,
    
    // Actions
    fetchLoops,
    fetchCommunities,
    createLoop,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    uploadCommunityPhoto,
    
    // Getters
    getCommunityMembers,
    getCommunityPhotos,
    getActivityFeed,
    isCommunityMember,
    
    // Setters
    setCurrentLoop,
    setCurrentCommunity,
    
    // Admin actions
    updateMemberRole,
    logActivity
  };
};