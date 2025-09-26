import React from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { View } from '../types';

interface ChatPageProps {
  onNavigate: (view: View) => void;
  targetProfileId: string | null;
  onTargetHandled: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onNavigate, targetProfileId, onTargetHandled }) => {
  React.useEffect(() => {
    if (targetProfileId) {
      console.log('Starting chat with profile:', targetProfileId);
      onTargetHandled();
    }
  }, [targetProfileId, onTargetHandled]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center">
          <button
            onClick={() => onNavigate('discover')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
        </div>

        {/* Chat Area */}
        <div className="h-96 bg-white m-4 rounded-lg shadow-md flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <div className="text-center text-gray-500 py-8">
              <p>Messaging functionality coming soon!</p>
              {targetProfileId && (
                <p className="text-sm mt-2">Would start chat with: {targetProfileId}</p>
              )}
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type your message..."
                disabled
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                disabled
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};