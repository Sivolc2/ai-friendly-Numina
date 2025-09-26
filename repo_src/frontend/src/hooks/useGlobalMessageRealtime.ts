import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Message } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UseGlobalMessageRealtimeProps {
  conversations: any[];
  onNewMessage: (message: Message) => void;
  onMessageUpdated: (message: Message) => void;
  onMessageDeleted: (messageId: string) => void;
  onConversationUpdated?: () => void;
  enabled?: boolean;
}

export const useGlobalMessageRealtime = ({ 
  conversations,
  onNewMessage,
  onMessageUpdated,
  onMessageDeleted,
  onConversationUpdated,
  enabled = true 
}: UseGlobalMessageRealtimeProps) => {
  const { user, userProfile } = useAuth();
  const channelRef = useRef<any>(null);
  const conversationIdsRef = useRef<string[]>([]);
  
  const formatMessage = (payload: any): Message => ({
    id: payload.id,
    conversationId: payload.conversation_id,
    senderId: payload.sender_id,
    content: payload.content,
    messageType: payload.message_type,
    createdAt: payload.created_at,
    editedAt: payload.edited_at,
    isDeleted: payload.is_deleted
  });

  // Update conversation IDs reference
  useEffect(() => {
    conversationIdsRef.current = conversations.map(c => c.id);
  }, [conversations]);

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      console.log('🧹 Cleaning up real-time channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  const isRelevantMessage = useCallback(async (conversationId: string) => {
    // First check if we already know about this conversation
    if (conversationIdsRef.current.includes(conversationId)) {
      return true;
    }

    // If not, check if the current user is a participant
    if (!userProfile) return false;

    try {
      const { data } = await supabase
        .from('conversations')
        .select('participant_ids')
        .eq('id', conversationId)
        .single();

      if (data?.participant_ids?.includes(userProfile.id)) {
        console.log('📨 Received message for new conversation:', conversationId);
        return true;
      }
    } catch (err) {
      console.warn('Error checking conversation relevance:', err);
    }
    
    return false;
  }, [userProfile]);

  useEffect(() => {
    if (!enabled || !user || !userProfile) {
      console.log('⏸️ Real-time disabled or user not ready');
      cleanupChannel();
      return;
    }

    // Clean up existing channel
    cleanupChannel();

    console.log('🔄 Setting up real-time subscriptions for user:', userProfile.id);

    // Create a single channel that listens to ALL messages
    const channel = supabase
      .channel('global_messages', {
        config: {
          broadcast: { self: false }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('📥 Received real-time INSERT:', payload.new.id, 'from:', payload.new.sender_id);
          
          // Skip own messages
          if (payload.new.sender_id === userProfile.id) {
            console.log('⏭️ Skipping own message');
            return;
          }
          
          // Check if this message is relevant to the current user
          const isRelevant = await isRelevantMessage(payload.new.conversation_id);
          if (!isRelevant) {
            console.log('⏭️ Message not relevant to current user');
            return;
          }
          
          const message = formatMessage(payload.new);
          if (!message.isDeleted) {
            console.log('✅ Processing new message:', message.id);
            onNewMessage(message);
            onConversationUpdated?.();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('📥 Received real-time UPDATE:', payload.new.id);
          
          // Skip own messages
          if (payload.new.sender_id === userProfile.id) {
            console.log('⏭️ Skipping own message update');
            return;
          }
          
          // Check if this message is relevant to the current user
          const isRelevant = await isRelevantMessage(payload.new.conversation_id);
          if (!isRelevant) {
            console.log('⏭️ Message update not relevant to current user');
            return;
          }
          
          if (payload.new.is_deleted) {
            console.log('🗑️ Processing message deletion:', payload.new.id);
            onMessageDeleted(payload.new.id);
          } else {
            console.log('✏️ Processing message update:', payload.new.id);
            const message = formatMessage(payload.new);
            onMessageUpdated(message);
          }
          onConversationUpdated?.();
        }
      )
      // Also listen for new conversations
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations'
        },
        async (payload) => {
          console.log('📥 Received new conversation:', payload.new.id);
          
          // Check if current user is a participant
          if (payload.new.participant_ids?.includes(userProfile.id)) {
            console.log('✅ New conversation includes current user, refreshing...');
            onConversationUpdated?.();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    channelRef.current = channel;

    return cleanupChannel;
  }, [enabled, user, userProfile, onNewMessage, onMessageUpdated, onMessageDeleted, onConversationUpdated, cleanupChannel, isRelevantMessage]);
};