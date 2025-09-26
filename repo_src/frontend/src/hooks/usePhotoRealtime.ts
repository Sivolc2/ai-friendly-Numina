import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PhotoStats } from '../types/interactions';

interface UsePhotoRealtimeProps {
  photoUrl: string;
  profileId: string;
  onStatsUpdate: (stats: PhotoStats) => void;
  enabled?: boolean;
}

export const usePhotoRealtime = ({ 
  photoUrl, 
  profileId, 
  onStatsUpdate, 
  enabled = true 
}: UsePhotoRealtimeProps) => {
  
  const refreshStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_photo_stats', {
        p_photo_url: photoUrl,
        p_profile_id: profileId
      });

      if (error) {
        console.error('Error fetching updated photo stats:', error);
        return;
      }

      if (data) {
        onStatsUpdate(data as PhotoStats);
      }
    } catch (error) {
      console.error('Error in refreshStats:', error);
    }
  }, [photoUrl, profileId, onStatsUpdate]);

  useEffect(() => {
    if (!enabled || !photoUrl || !profileId) return;

    // Subscribe to photo loves changes
    const lovesChannel = supabase
      .channel(`photo_loves_${photoUrl}_${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_loves',
          filter: `photo_url=eq.${photoUrl} AND profile_id=eq.${profileId}`
        },
        (payload) => {
          console.log('Photo loves changed:', payload);
          refreshStats();
        }
      )
      .subscribe((status) => {
        console.log('Photo loves subscription status:', status);
      });

    // Subscribe to photo comments changes
    const commentsChannel = supabase
      .channel(`photo_comments_${photoUrl}_${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_comments',
          filter: `photo_url=eq.${photoUrl} AND profile_id=eq.${profileId}`
        },
        (payload) => {
          console.log('Photo comments changed:', payload);
          refreshStats();
        }
      )
      .subscribe((status) => {
        console.log('Photo comments subscription status:', status);
      });

    // Cleanup function
    return () => {
      console.log('Cleaning up photo realtime subscriptions');
      supabase.removeChannel(lovesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [photoUrl, profileId, enabled, refreshStats]);

  return { refreshStats };
};