import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Community } from '../types';

export const useCommunity = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events') // Still using events table until we migrate DB
        .select(`
          id,
          name,
          location,
          date,
          description,
          cover_image,
          is_private,
          participant_count,
          tags,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedCommunities = (data || []).map(community => ({
        id: community.id,
        name: community.name,
        location: community.location,
        date: community.date,
        description: community.description,
        coverImage: community.cover_image,
        isPrivate: community.is_private,
        participantCount: community.participant_count,
        tags: Array.isArray(community.tags) ? community.tags : (typeof community.tags === 'string' && community.tags ? (() => {
          try {
            return JSON.parse(community.tags);
          } catch (e) {
            console.warn('Failed to parse community tags:', community.tags, e);
            return [];
          }
        })() : []),
        userId: community.user_id
      }));

      setCommunities(mappedCommunities);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    communities,
    loading,
    fetchCommunities,
    setCommunities
  };
};

// Legacy export for backward compatibility during transition
export const useEvents = useCommunity;