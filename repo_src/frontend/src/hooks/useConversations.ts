import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Conversation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { perf } from '../utils/performance';

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  createConversation: (otherUserId: string) => Promise<string | null>;
  refreshConversations: () => Promise<void>;
  getOrCreateConversation: (otherProfileId: string) => Promise<string | null>;
}

// Simple cache for conversations
const conversationCache = {
  data: null as Conversation[] | null,
  timestamp: 0,
  profileId: null as string | null,
  ttl: 30000 // 30 seconds cache
};

export const useConversations = (): UseConversationsReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, userProfile } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!user || !userProfile) {
      return;
    }

    // Check cache first
    const now = Date.now();
    if (conversationCache.data && 
        conversationCache.profileId === userProfile.id && 
        (now - conversationCache.timestamp) < conversationCache.ttl) {
      perf.logCacheHit('conversations');
      setConversations(conversationCache.data);
      return;
    }

    perf.logCacheMiss('conversations');
    perf.startTimer('fetchConversations');
    setLoading(true);
    setError(null);

    try {
      // Use direct query for better performance and reliability
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_ids,
          created_at,
          updated_at
        `)
        .contains('participant_ids', [userProfile.id])
        .order('updated_at', { ascending: false });


      if (fetchError) throw fetchError;

      // Format conversations with basic info
      const formattedConversations: Conversation[] = (data || []).map(conv => ({
        id: conv.id,
        participantIds: conv.participant_ids,
        participantNames: ['Loading...'], // Will be loaded asynchronously
        participantPhotos: [],
        lastMessageContent: null,
        lastMessageSenderId: null,
        lastMessageAt: conv.updated_at,
        unreadCount: 0,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at
      }));

      setConversations(formattedConversations);
      
      // Update cache
      conversationCache.data = formattedConversations;
      conversationCache.timestamp = now;
      conversationCache.profileId = userProfile.id;
      
      // Asynchronously load participant names and last messages
      if (formattedConversations.length > 0) {
        loadConversationDetails(formattedConversations);
      }
      
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
      perf.endTimer('fetchConversations');
    }
  }, [user, userProfile]);

  const loadConversationDetails = useCallback(async (conversations: Conversation[]) => {
    if (!userProfile) return;

    try {
      // Load participant details in parallel
      const conversationDetailsPromises = conversations.map(async (conv) => {
        const otherParticipantIds = conv.participantIds.filter(id => id !== userProfile.id);
        
        if (otherParticipantIds.length === 0) return conv;

        // Get participant names and photos
        const { data: participants } = await supabase
          .from('profiles')
          .select('id, name, main_photo')
          .in('id', otherParticipantIds);

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, sender_id, created_at')
          .eq('conversation_id', conv.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...conv,
          participantNames: participants?.map(p => p.name) || ['Unknown'],
          participantPhotos: participants?.map(p => p.main_photo).filter(Boolean) || [],
          lastMessageContent: lastMessage?.content || null,
          lastMessageSenderId: lastMessage?.sender_id || null,
          lastMessageAt: lastMessage?.created_at || conv.updated_at
        };
      });

      const detailedConversations = await Promise.all(conversationDetailsPromises);
      
      // Update state with detailed info
      setConversations(detailedConversations);
      
      // Update cache
      conversationCache.data = detailedConversations;
      conversationCache.timestamp = Date.now();
      
    } catch (err) {
      console.warn('Error loading conversation details:', err);
      // Don't set error state as basic conversations are already loaded
    }
  }, [userProfile]);

  const createConversation = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('conversations')
        .insert({
          participant_ids: [user.id, otherUserId].sort()
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Invalidate cache and refresh
      conversationCache.data = null;
      await fetchConversations();
      return data.id;
      
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      return null;
    }
  }, [user, fetchConversations]);

  const getOrCreateConversation = useCallback(async (otherProfileId: string): Promise<string | null> => {
    if (!user || !userProfile) {
      console.log('useConversations: getOrCreateConversation - no user or userProfile');
      return null;
    }

    console.log('useConversations: getOrCreateConversation called with:', { 
      userProfileId: userProfile.id, 
      otherProfileId 
    });

    try {
      // Try to find existing conversation first
      const participantIds = [userProfile.id, otherProfileId].sort();
      const { data: existingConversation, error: searchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_ids', participantIds)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (existingConversation) {
        console.log('useConversations: Found existing conversation:', existingConversation.id);
        return existingConversation.id;
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({ participant_ids: participantIds })
        .select('id')
        .single();

      if (createError) throw createError;
      
      console.log('useConversations: Created new conversation:', newConversation.id);
      
      // Optimistically add to conversations list
      const optimisticConversation: Conversation = {
        id: newConversation.id,
        participantIds,
        participantNames: ['Loading...'],
        participantPhotos: [],
        lastMessageContent: null,
        lastMessageSenderId: null,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setConversations(prev => [optimisticConversation, ...prev]);
      
      // Invalidate cache and refresh in background (no delay)
      conversationCache.data = null;
      setTimeout(() => fetchConversations(), 100);
      
      return newConversation.id;
      
    } catch (err) {
      console.error('Error getting or creating conversation:', err);
      setError('Failed to start conversation');
      return null;
    }
  }, [user, userProfile, fetchConversations]);

  const refreshConversations = useCallback(async () => {
    // Invalidate cache on manual refresh
    console.log('💾 Invalidating conversation cache');
    conversationCache.data = null;
    await fetchConversations();
  }, [fetchConversations]);

  // Initial fetch - start as soon as we have a user (don't wait for full profile)
  useEffect(() => {
    if (user && userProfile) {
      fetchConversations();
    }
  }, [user?.id, userProfile?.id, fetchConversations]);

  return {
    conversations,
    loading,
    error,
    createConversation,
    refreshConversations,
    getOrCreateConversation
  };
};