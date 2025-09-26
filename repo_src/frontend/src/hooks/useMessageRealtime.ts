import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Message } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UseMessageRealtimeProps {
  conversationId: string; // If empty, listen to all user's conversations
  onNewMessage: (message: Message) => void;
  onMessageUpdated: (message: Message) => void;
  onMessageDeleted: (messageId: string) => void;
  onConversationUpdated?: () => void;
  enabled?: boolean;
}

// Global subscription manager to prevent duplicate global subscriptions
const globalSubscriptions = new Map<string, any>();

export const useMessageRealtime = ({ 
  conversationId, 
  onNewMessage,
  onMessageUpdated,
  onMessageDeleted,
  onConversationUpdated,
  enabled = true 
}: UseMessageRealtimeProps) => {
  const activeChannelsRef = useRef<Map<string, any>>(new Map());
  const { userProfile } = useAuth();
  
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

  const fetchMessageWithSender = useCallback(async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, name, main_photo, photos)
        `)
        .eq('id', messageId)
        .single();

      if (error) {
        console.error('Error fetching message with sender:', error);
        return null;
      }

      return {
        ...formatMessage(data),
        sender: data.sender ? {
          id: data.sender.id,
          name: data.sender.name,
          mainPhoto: data.sender.main_photo,
          photos: data.sender.photos || []
        } as any : undefined
      };
    } catch (error) {
      console.error('Error in fetchMessageWithSender:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !userProfile) {
      return;
    }

    // Determine subscription strategy
    const isGlobalSubscription = !conversationId;
    const messagesChannelName = isGlobalSubscription ? `messages_global_${userProfile.id}` : `messages_${conversationId}`;
    const conversationChannelName = isGlobalSubscription ? `conversation_global_${userProfile.id}` : `conversation_${conversationId}`;

    // Check if we already have active subscriptions
    if (activeChannelsRef.current.has(messagesChannelName)) {
      console.log(`Realtime subscription already active for: ${isGlobalSubscription ? 'all conversations' : conversationId}`);
      return;
    }

    console.log(`Setting up realtime subscriptions for: ${isGlobalSubscription ? 'all user conversations' : 'conversation ' + conversationId}`);

    // Create message subscription with improved error handling
    const messagesChannel = supabase
      .channel(messagesChannelName, {
        config: {
          presence: { key: isGlobalSubscription ? userProfile.id : conversationId }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // For global: no filter (listen to all), for specific: filter by conversation
          filter: isGlobalSubscription 
            ? undefined // Listen to all messages, filter in handler
            : `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('New message received:', payload.new.id);
          
          try {
            // For global subscriptions, check if user participates in this conversation
            if (isGlobalSubscription) {
              const { data: conversation } = await supabase
                .from('conversations')
                .select('participant_ids')
                .eq('id', payload.new.conversation_id)
                .single();
              
              // Only process if user is a participant and didn't send the message
              if (!conversation || !conversation.participant_ids.includes(userProfile.id) || payload.new.sender_id === userProfile.id) {
                return;
              }
            }
            
            // Fetch the complete message with sender info
            const messageWithSender = await fetchMessageWithSender(payload.new.id);
            if (messageWithSender && !messageWithSender.isDeleted) {
              onNewMessage(messageWithSender);
              
              // Notify that conversation should be refreshed (for last message update)
              if (onConversationUpdated) {
                onConversationUpdated();
              }
            }
          } catch (error) {
            console.error('Error processing new message:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: isGlobalSubscription 
            ? undefined
            : `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('Message updated:', payload.new.id);
          
          try {
            // For global subscriptions, check if user participates in this conversation
            if (isGlobalSubscription) {
              const { data: conversation } = await supabase
                .from('conversations')
                .select('participant_ids')
                .eq('id', payload.new.conversation_id)
                .single();
              
              // Only process if user is a participant and didn't send the message
              if (!conversation || !conversation.participant_ids.includes(userProfile.id) || payload.new.sender_id === userProfile.id) {
                return;
              }
            }
            
            if (payload.new.is_deleted) {
              onMessageDeleted(payload.new.id);
            } else {
              // Fetch the complete updated message with sender info
              const messageWithSender = await fetchMessageWithSender(payload.new.id);
              if (messageWithSender) {
                onMessageUpdated(messageWithSender);
              }
            }

            // Notify that conversation should be refreshed
            if (onConversationUpdated) {
              onConversationUpdated();
            }
          } catch (error) {
            console.error('Error processing message update:', error);
          }
        }
      )
      .subscribe((status) => {
        const target = isGlobalSubscription ? 'all conversations' : `conversation ${conversationId}`;
        console.log('Messages subscription status:', status, 'for:', target);
        
        if (status === 'SUBSCRIBED') {
          console.log(`Messages realtime subscription established for ${target}`);
        } else if (status === 'CLOSED') {
          console.log(`Messages realtime subscription closed for ${target}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Messages realtime subscription error for ${target}`);
        }
      });

    // Create conversation subscription for metadata updates
    const conversationChannel = supabase
      .channel(conversationChannelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: isGlobalSubscription 
            ? undefined // Listen to all conversation updates, we'll filter in handler
            : `id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Conversation updated:', isGlobalSubscription ? payload.new.id : conversationId);
          try {
            // For global subscriptions, check if user participates in this conversation
            if (isGlobalSubscription) {
              if (!payload.new.participant_ids || !payload.new.participant_ids.includes(userProfile.id)) {
                return; // Not our conversation
              }
            }
            
            if (onConversationUpdated) {
              onConversationUpdated();
            }
          } catch (error) {
            console.error('Error processing conversation update:', error);
          }
        }
      )
      .subscribe((status) => {
        const target = isGlobalSubscription ? 'all conversations' : `conversation ${conversationId}`;
        console.log('Conversation subscription status:', status, 'for:', target);
      });

    // Store channels in the ref for cleanup
    activeChannelsRef.current.set(messagesChannelName, messagesChannel);
    activeChannelsRef.current.set(conversationChannelName, conversationChannel);

    // Cleanup function
    return () => {
      const target = isGlobalSubscription ? 'all conversations' : `conversation ${conversationId}`;
      console.log('Cleaning up realtime subscriptions for:', target);
      
      // Get channels from ref and unsubscribe
      const storedMessagesChannel = activeChannelsRef.current.get(messagesChannelName);
      const storedConversationChannel = activeChannelsRef.current.get(conversationChannelName);
      
      if (storedMessagesChannel) {
        supabase.removeChannel(storedMessagesChannel);
        activeChannelsRef.current.delete(messagesChannelName);
      }
      
      if (storedConversationChannel) {
        supabase.removeChannel(storedConversationChannel);
        activeChannelsRef.current.delete(conversationChannelName);
      }
    };
  }, [conversationId, enabled, userProfile, fetchMessageWithSender, onNewMessage, onMessageUpdated, onMessageDeleted, onConversationUpdated]);
};