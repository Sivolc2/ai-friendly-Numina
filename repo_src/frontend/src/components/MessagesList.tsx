import React from 'react';
import { MessageCircle, Search, User } from 'lucide-react';
import { Conversation } from '../types';
import { LazyImage } from './LazyImage';

interface MessagesListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewChat: () => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const MessagesList: React.FC<MessagesListProps> = ({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onNewChat,
  loading,
  searchQuery,
  onSearchChange
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participantNames.some(name =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Messages
          </h2>
          <button
            onClick={onNewChat}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">
              {conversations.length === 0 ? 'No conversations yet' : 'No matching conversations'}
            </p>
            <p className="text-xs mt-1">
              {conversations.length === 0 ? 'Start a new chat to begin messaging' : 'Try a different search term'}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {filteredConversations.map((conversation) => {
              const otherPersonName = conversation.participantNames[0] || 'Unknown User';
              const otherPersonPhoto = conversation.participantPhotos[0];
              const isSelected = conversation.id === selectedConversationId;
              const hasUnread = conversation.unreadCount > 0;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`mx-2 mb-1 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
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
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm truncate ${
                          hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                        }`}>
                          {otherPersonName}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      
                      {conversation.lastMessageContent && (
                        <p className={`text-sm truncate ${
                          hasUnread ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {conversation.lastMessageSenderId && (
                            <span className="mr-1">
                              {conversation.lastMessageSenderId === conversation.participantIds.find(id => id !== conversation.lastMessageSenderId) 
                                ? '' 
                                : 'You: '
                              }
                            </span>
                          )}
                          {conversation.lastMessageContent}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};