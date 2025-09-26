import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Event } from '../types';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
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

      const mappedEvents = (data || []).map(event => ({
        id: event.id,
        name: event.name,
        location: event.location,
        date: event.date,
        description: event.description,
        coverImage: event.cover_image,
        isPrivate: event.is_private,
        participantCount: event.participant_count,
        tags: Array.isArray(event.tags) ? event.tags : (typeof event.tags === 'string' && event.tags ? (() => {
          try {
            return JSON.parse(event.tags);
          } catch (e) {
            console.warn('Failed to parse event tags:', event.tags, e);
            return [];
          }
        })() : []),
        userId: event.user_id
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    fetchEvents,
    setEvents
  };
};