import React, { useState, useMemo } from 'react';
import { Search, User, MessageCircle } from 'lucide-react';
import { Conversation } from '../types';
import { LazyImage } from './LazyImage';
import { ConversationSkeleton } from './ConversationSkeleton';

const DEBUG = process.env.NODE_ENV !== 'production';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onConversationSelect: (conversation: Conversation) => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = React.memo(({
  conversations,
  selectedConversation,
  onConversationSelect,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  if (DEBUG) console.log('ConversationList: Rendering with', conversations?.length || 0, 'conversations');

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => 
    (conversations || []).filter(conversation => {
      if (!conversation) return false;
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (conversation.participantNames || []).some(name => 
        name && name.toLowerCase().includes(query)
      ) || 
      (conversation.lastMessageContent && 
       conversation.lastMessageContent.toLowerCase().includes(query));
    }), [conversations, searchQuery]
  );

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 1 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Show skeleton while loading
  if (loading || (!conversations && loading !== false)) {
    if (DEBUG) console.log('ConversationList: Showing loading skeleton');
    return (
      <div className="flex-1 flex flex-col">
        {/* Search skeleton */}
        <div className="p-3 border-b border-gray-100">
          <div className="h-9 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Conversation skeletons */}
        <div className="flex-1 overflow-y-auto">
          <ConversationSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    if (DEBUG) console.log('ConversationList: No conversations available');
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">No conversations yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Start messaging someone to see conversations here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 text-sm">No conversations match your search</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id;
              const otherPersonName = conversation.participantNames[0] || 'Unknown User';
              const otherPersonPhoto = conversation.participantPhotos[0];
              const hasUnread = conversation.unreadCount > 0;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      {otherPersonPhoto ? (
                        <LazyImage
                          src={otherPersonPhoto}
                          alt={otherPersonName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      {/* Online indicator (placeholder for future feature) */}
                      {/* <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div> */}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium truncate ${
                          hasUnread ? 'text-gray-900' : 'text-gray-800'
                        }`}>
                          {otherPersonName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {conversation.lastMessageAt && (
                            <span className={`text-xs ${
                              hasUnread ? 'text-blue-600 font-medium' : 'text-gray-500'
                            }`}>
                              {formatLastMessageTime(conversation.lastMessageAt)}
                            </span>
                          )}
                          {hasUnread && (
                            <div className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Last message preview */}
                      <p className={`text-sm truncate ${
                        hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
                      }`}>
                        {conversation.lastMessageContent 
                          ? truncateMessage(conversation.lastMessageContent)
                          : 'No messages yet'
                        }
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with conversation count */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {filteredConversations.length} of {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>
    </div>
  );
});

ConversationList.displayName = 'ConversationList';