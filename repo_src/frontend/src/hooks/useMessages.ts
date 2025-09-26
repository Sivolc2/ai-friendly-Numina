import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Message } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UseMessagesProps {
  conversationId?: string;
  enabled?: boolean;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, messageType?: 'text' | 'image' | 'file') => Promise<boolean>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

const MESSAGES_PER_PAGE = 50;

export const useMessages = ({ 
  conversationId, 
  enabled = true 
}: UseMessagesProps = {}): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { user, userProfile } = useAuth();

  const fetchMessages = useCallback(async (isLoadMore = false) => {
    if (!conversationId || !enabled || !user) return;

    setLoading(true);
    setError(null);

    try {
      const currentOffset = isLoadMore ? offset : 0;
      
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(id, name, main_photo, photos)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + MESSAGES_PER_PAGE - 1);

      if (fetchError) throw fetchError;

      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        messageType: msg.message_type,
        createdAt: msg.created_at,
        editedAt: msg.edited_at,
        isDeleted: msg.is_deleted,
        sender: msg.sender ? {
          id: msg.sender.id,
          name: msg.sender.name,
          mainPhoto: msg.sender.main_photo,
          photos: msg.sender.photos || []
        } as any : undefined
      }));

      if (isLoadMore) {
        setMessages(prev => [...prev, ...formattedMessages]);
        setOffset(prev => prev + MESSAGES_PER_PAGE);
      } else {
        // Reverse to show newest at bottom
        setMessages(formattedMessages.reverse());
        setOffset(MESSAGES_PER_PAGE);
      }

      setHasMore(formattedMessages.length === MESSAGES_PER_PAGE);
      
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, enabled, user, offset]);

  const sendMessage = useCallback(async (
    content: string, 
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<boolean> => {
    if (!conversationId || !user || !userProfile || !content.trim()) {
      return false;
    }

    console.log('📤 Sending message:', { conversationId, content: content.substring(0, 50) + '...' });
    setError(null);
    
    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: userProfile.id,
      content: content.trim(),
      messageType,
      createdAt: new Date().toISOString(),
      editedAt: null,
      isDeleted: false,
      sender: {
        id: userProfile.id,
        name: userProfile.name,
        mainPhoto: userProfile.mainPhoto,
        photos: userProfile.photos || []
      } as any
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userProfile.id,
          content: content.trim(),
          message_type: messageType
        })
        .select(`
          *,
          sender:profiles(id, name, main_photo, photos)
        `);

      if (insertError) throw insertError;

      console.log('✅ Message sent successfully:', data[0].id);

      // Replace optimistic message with real one
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== optimisticMessage.id);
        const newMessage: Message = {
          id: data[0].id,
          conversationId: data[0].conversation_id,
          senderId: data[0].sender_id,
          content: data[0].content,
          messageType: data[0].message_type,
          createdAt: data[0].created_at,
          editedAt: data[0].edited_at,
          isDeleted: data[0].is_deleted,
          sender: data[0].sender ? {
            id: data[0].sender.id,
            name: data[0].sender.name,
            mainPhoto: data[0].sender.main_photo,
            photos: data[0].sender.photos || []
          } as any : undefined
        };
        return [...filtered, newMessage];
      });

      return true;
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      
      // Set user-friendly error
      if (err.code === '42501') {
        setError('You cannot send messages in this conversation');
      } else {
        setError('Failed to send message');
      }
      
      return false;
    }
  }, [conversationId, user, userProfile]);

  const editMessage = useCallback(async (
    messageId: string, 
    newContent: string
  ): Promise<boolean> => {
    if (!user || !userProfile || !newContent.trim()) {
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ 
          content: newContent.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userProfile.id);

      if (updateError) throw updateError;

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent.trim(), editedAt: new Date().toISOString() }
          : msg
      ));

      return true;
      
    } catch (err) {
      console.error('Error editing message:', err);
      setError('Failed to edit message');
      return false;
    }
  }, [user, userProfile]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user || !userProfile) return false;

    try {
      const { error: deleteError } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId)
        .eq('sender_id', userProfile.id);

      if (deleteError) throw deleteError;

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      return true;
      
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
      return false;
    }
  }, [user, userProfile]);

  const refreshMessages = useCallback(async () => {
    setOffset(0);
    await fetchMessages(false);
  }, [fetchMessages]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchMessages(true);
  }, [hasMore, loading, fetchMessages]);

  // Initial fetch
  useEffect(() => {
    if (conversationId && enabled) {
      setMessages([]);
      setOffset(0);
      setHasMore(true);
      fetchMessages(false);
    }
  }, [conversationId, enabled]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    refreshMessages,
    hasMore,
    loadMore
  };
};