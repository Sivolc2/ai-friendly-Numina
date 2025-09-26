import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface PhotoAnalytics {
  totalLoves: number;
  totalComments: number;
  totalPhotos: number;
  totalInteractions: number;
  mostLovedPhoto?: {
    photoUrl: string;
    loveCount: number;
    profileName: string;
    profileId: string;
  };
  mostCommentedPhoto?: {
    photoUrl: string;
    commentCount: number;
    profileName: string;
    profileId: string;
  };
  topCommenters: Array<{
    profileName: string;
    profileId: string;
    commentCount: number;
  }>;
  engagementRate: number;
  activeProfiles: number;
}

export interface DailyEngagementStats {
  dailyStats: Array<{
    date: string;
    loves: number;
    comments: number;
    total: number;
  }>;
}

export interface TopEngagedProfiles {
  topProfiles: Array<{
    profileId: string;
    profileName: string;
    coverPhoto?: string;
    totalLoves: number;
    totalComments: number;
    totalInteractions: number;
  }>;
}

export interface RecentActivity {
  recentActivity: Array<{
    type: 'love' | 'comment';
    photoUrl: string;
    actorName: string;
    targetName: string;
    commentPreview?: string;
    createdAt: string;
  }>;
}

export const usePhotoAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPhotoInteractionStats = useCallback(async (): Promise<PhotoAnalytics | null> => {
    setLoading(true);
    setError(null);
    try {
      // Try to use the RPC function first
      const { data, error } = await supabase.rpc('get_photo_interaction_stats');

      if (error) {
        // If RPC fails, fallback to direct queries
        console.warn('RPC function not available, using fallback queries:', error);
        return await getFallbackAnalytics();
      }

      const analytics: PhotoAnalytics = {
        totalLoves: data.total_loves,
        totalComments: data.total_comments,
        totalPhotos: data.total_photos,
        totalInteractions: data.total_interactions,
        mostLovedPhoto: data.most_loved_photo ? {
          photoUrl: data.most_loved_photo.photo_url,
          loveCount: data.most_loved_photo.love_count,
          profileName: data.most_loved_photo.profile_name,
          profileId: data.most_loved_photo.profile_id
        } : undefined,
        mostCommentedPhoto: data.most_commented_photo ? {
          photoUrl: data.most_commented_photo.photo_url,
          commentCount: data.most_commented_photo.comment_count,
          profileName: data.most_commented_photo.profile_name,
          profileId: data.most_commented_photo.profile_id
        } : undefined,
        topCommenters: data.top_commenters || [],
        engagementRate: data.engagement_rate,
        activeProfiles: data.active_profiles
      };

      return analytics;
    } catch (err) {
      console.error('Error fetching photo analytics:', err);
      // Try fallback approach
      try {
        return await getFallbackAnalytics();
      } catch (fallbackErr) {
        console.error('Fallback analytics also failed:', fallbackErr);
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getFallbackAnalytics = useCallback(async (): Promise<PhotoAnalytics> => {
    // Get basic counts using direct queries
    const [lovesResult, commentsResult, profilesResult] = await Promise.all([
      supabase.from('photo_loves').select('*', { count: 'exact', head: true }),
      supabase.from('photo_comments').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('has_completed_profile', true)
    ]);

    const totalLoves = lovesResult.count || 0;
    const totalComments = commentsResult.count || 0;
    const activeProfiles = profilesResult.count || 0;

    return {
      totalLoves,
      totalComments,
      totalPhotos: 0, // Would need complex query to count photos in arrays
      totalInteractions: totalLoves + totalComments,
      engagementRate: activeProfiles > 0 ? Math.round((totalLoves + totalComments) / activeProfiles * 100) / 100 : 0,
      activeProfiles,
      topCommenters: []
    };
  }, []);

  const getDailyEngagementStats = useCallback(async (): Promise<DailyEngagementStats | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_daily_engagement_stats');

      if (error) throw error;

      return data as DailyEngagementStats;
    } catch (err) {
      console.error('Error fetching daily engagement stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch daily stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTopEngagedProfiles = useCallback(async (): Promise<TopEngagedProfiles | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_top_engaged_profiles');

      if (error) throw error;

      return data as TopEngagedProfiles;
    } catch (err) {
      console.error('Error fetching top engaged profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch top profiles');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecentActivity = useCallback(async (): Promise<RecentActivity | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_recent_photo_activity');

      if (error) throw error;

      return data as RecentActivity;
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPhotoInteractionStats,
    getDailyEngagementStats,
    getTopEngagedProfiles,
    getRecentActivity
  };
};