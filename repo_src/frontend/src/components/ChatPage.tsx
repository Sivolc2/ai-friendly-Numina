import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { useGlobalMessageRealtime } from '../hooks/useGlobalMessageRealtime';
import { ConversationList } from './ConversationList';
import { ChatInterface } from './ChatInterface';
import { Conversation } from '../types';

interface ChatPageProps {
  onNavigate?: (view: string) => void;
  targetProfileId?: string | null;
  onTargetHandled?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onNavigate, targetProfileId, onTargetHandled }) => {
  const { user, userProfile, refreshProfile } = useAuth();
  const { conversations, loading, getOrCreateConversation, refreshConversations } = useConversations();

  // Handle missing profile
  useEffect(() => {
    if (user && !userProfile && !loading) {
      refreshProfile();
    }
  }, [user, userProfile, loading, refreshProfile]);
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);

  // Message hooks for the selected conversation
  const { 
    messages, 
    loading: messagesLoading,
    sendMessage,
    refreshMessages,
    hasMore,
    loadMore
  } = useMessages({ 
    conversationId: selectedConversation?.id || undefined, 
    enabled: !!selectedConversation 
  });

  // Realtime message handling
  const handleNewMessage = useCallback((message: any) => {
    console.log('🔥 ChatPage: Handling new message for conversation:', message.conversationId);
    
    if (selectedConversation?.id === message.conversationId) {
      console.log('📨 Refreshing messages for active conversation');
      refreshMessages();
    }
    
    // Always refresh conversations to update last message and show new conversations
    console.log('🔄 Refreshing conversations list');
    refreshConversations();
  }, [selectedConversation?.id, refreshMessages, refreshConversations]);

  const handleMessageUpdated = useCallback((message: any) => {
    console.log('✏️ ChatPage: Handling message update for conversation:', message.conversationId);
    
    if (selectedConversation?.id === message.conversationId) {
      refreshMessages();
    }
    refreshConversations();
  }, [selectedConversation?.id, refreshMessages, refreshConversations]);

  const handleMessageDeleted = useCallback((_messageId: string) => {
    console.log('🗑️ ChatPage: Handling message deletion');
    
    if (selectedConversation) {
      refreshMessages();
    }
    refreshConversations();
  }, [selectedConversation, refreshMessages, refreshConversations]);

  const handleConversationUpdated = useCallback(() => {
    console.log('🆕 ChatPage: Handling conversation update');
    refreshConversations();
  }, [refreshConversations]);

  // Global real-time messaging - listen for all conversations
  useGlobalMessageRealtime({
    conversations: conversations || [],
    enabled: !!userProfile,
    onNewMessage: handleNewMessage,
    onMessageUpdated: handleMessageUpdated,
    onMessageDeleted: handleMessageDeleted,
    onConversationUpdated: handleConversationUpdated
  });


  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStartNewConversation = useCallback(async (profileId: string) => {
    if (!userProfile) return;
    
    try {
      const newConversationId = await getOrCreateConversation(profileId);
      
      if (newConversationId) {
        setPendingConversationId(newConversationId);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      setPendingConversationId(null);
    }
  }, [userProfile, getOrCreateConversation]);

  // Handle new conversation from prop or URL params
  useEffect(() => {
    if (targetProfileId && userProfile && !pendingConversationId) {
      handleStartNewConversation(targetProfileId);
      onTargetHandled?.();
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const newProfileId = urlParams.get('with');
    if (newProfileId && userProfile && !pendingConversationId) {
      handleStartNewConversation(newProfileId);
    }
  }, [targetProfileId, userProfile, pendingConversationId, handleStartNewConversation, onTargetHandled]);

  // Handle pending conversation selection
  useEffect(() => {
    if (pendingConversationId && conversations.length > 0 && !loading) {
      const conversation = conversations.find(c => c.id === pendingConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        setShowChatWindow(true);
        setPendingConversationId(null);
      }
    }
  }, [conversations, pendingConversationId, loading]);

  // Timeout for pending conversation
  useEffect(() => {
    if (pendingConversationId) {
      const timeout = setTimeout(() => setPendingConversationId(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [pendingConversationId]);


  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (isMobileView) {
      setShowChatWindow(true);
    }
  }, [isMobileView]);

  const handleBackToList = () => {
    setShowChatWindow(false);
    setSelectedConversation(null);
  };

  const handleSendMessage = async (content: string) => {
    const success = await sendMessage(content);
    if (success) {
      refreshConversations();
    }
    return success;
  };

  // Show auth required state
  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to access messages</h2>
            <p className="text-gray-500">You need to be signed in to view and send messages.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state only if we don't have profile and conversations are still loading
  if (!userProfile && loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state if creating a conversation
  if (pendingConversationId) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500">Setting up your conversation...</p>
            <p className="text-xs text-gray-400 mt-2">Conversation ID: {pendingConversationId}</p>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="fixed inset-0 bg-gray-50" style={{ paddingTop: '80px', paddingBottom: '64px' }}>
      {/* Main Chat Layout - Fixed height excluding header and bottom nav */}
      <div className="h-full flex overflow-hidden">
        {/* Conversation List - Fixed positioned sidebar */}
        <div className={`${
          isMobileView 
            ? (showChatWindow ? 'hidden' : 'w-full') 
            : 'w-80 border-r border-gray-200'
        } bg-white flex flex-col overflow-hidden`}>
          
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              <div className="text-sm text-gray-500">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Conversation List - Scrollable */}
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onConversationSelect={handleConversationSelect}
              loading={loading}
            />
          </div>

        </div>

        {/* Chat Area */}
        <div className={`${
          isMobileView 
            ? (showChatWindow ? 'w-full' : 'hidden') 
            : 'flex-1'
        } flex`}>
          
          {selectedConversation ? (
            <ChatInterface
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onBack={handleBackToList}
              loading={messagesLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          ) : (
            // Empty state when no conversation selected
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-sm mx-auto px-6">
                <MessageCircle className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {conversations.length === 0 ? 'No conversations yet' : 'Select a conversation'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {conversations.length === 0 
                    ? 'Start a conversation by visiting someone\'s profile and clicking "Message"'
                    : 'Choose a conversation from the list to start messaging'
                  }
                </p>
                {conversations.length === 0 && (
                  <button
                    onClick={() => onNavigate?.('discover')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Browse Profiles
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};