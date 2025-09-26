import React, { useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { Message, Conversation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { MessageInput } from './MessageInput';

interface ChatInterfaceProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (content: string) => Promise<boolean>;
  onBack: () => void;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  messages,
  onSendMessage,
  onBack,
  loading,
  hasMore,
  onLoadMore
}) => {
  const { userProfile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string>('');
  const shouldAutoScrollRef = useRef(true);
  const userScrolledUpRef = useRef(false);

  // Check if user has scrolled up from bottom
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px tolerance
    
    userScrolledUpRef.current = !isNearBottom;
    shouldAutoScrollRef.current = isNearBottom;
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    if (!force && userScrolledUpRef.current && !shouldAutoScrollRef.current) {
      console.log('🔒 Skipping auto-scroll - user has scrolled up');
      return;
    }

    console.log('📜 Auto-scrolling to bottom');
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
    
    // Reset scroll state after scrolling
    setTimeout(() => {
      userScrolledUpRef.current = false;
      shouldAutoScrollRef.current = true;
    }, 300);
  }, []);

  // Auto-scroll logic for different scenarios
  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const lastMessageId = lastMessage.id;
    const isNewMessage = lastMessageId !== lastMessageIdRef.current;

    // Scenario 1: Initial conversation load or conversation switch
    if (!lastMessageIdRef.current) {
      console.log('📜 Initial load - scrolling to bottom');
      setTimeout(() => scrollToBottom(true), 100); // Small delay for DOM updates
    }
    // Scenario 2: New message added
    else if (isNewMessage) {
      const isMyMessage = lastMessage.senderId === userProfile?.id;
      
      if (isMyMessage) {
        // Always scroll for own messages
        console.log('📤 Own message - scrolling to bottom');
        scrollToBottom(true);
      } else {
        // For others' messages, only scroll if user is at bottom
        console.log('📥 Received message - checking scroll position');
        scrollToBottom(false);
      }
    }

    lastMessageIdRef.current = lastMessageId;
  }, [messages, userProfile?.id, scrollToBottom]);

  // Reset scroll state when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      console.log('🔄 Conversation changed - resetting scroll state');
      lastMessageIdRef.current = '';
      userScrolledUpRef.current = false;
      shouldAutoScrollRef.current = true;
    }
  }, [conversation?.id]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkScrollPosition, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
    };
  }, [checkScrollPosition]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleLoadMore = useCallback(() => {
    // When loading more, we want to preserve scroll position
    userScrolledUpRef.current = true;
    shouldAutoScrollRef.current = false;
    onLoadMore();
  }, [onLoadMore]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const otherPerson = conversation.participantNames[0] || 'Unknown User';
  const otherPersonPhoto = conversation.participantPhotos[0];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            {otherPersonPhoto ? (
              <img
                src={otherPersonPhoto}
                alt={otherPerson}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            )}
            
            <div>
              <h3 className="font-medium text-gray-900">{otherPerson}</h3>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Start the conversation by sending a message
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === userProfile?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                    isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    {/* Avatar for other person's messages */}
                    {!isOwnMessage && (
                      <>
                        {message.sender?.mainPhoto ? (
                          <img
                            src={message.sender.mainPhoto}
                            alt={message.sender?.name || 'User'}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </>
                    )}

                    {/* Message bubble */}
                    <div className={`px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.createdAt)}
                        {message.editedAt && ' (edited)'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom indicator */}
      {userScrolledUpRef.current && (
        <div className="absolute bottom-20 right-8">
          <button
            onClick={() => scrollToBottom(true)}
            className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            title="Scroll to bottom"
          >
            ↓
          </button>
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        placeholder={`Message ${otherPerson}...`}
      />
    </div>
  );
};