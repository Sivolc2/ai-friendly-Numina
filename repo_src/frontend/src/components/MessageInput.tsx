import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<boolean>;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message..."
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || sending || disabled) return;

    setSending(true);
    try {
      const success = await onSendMessage(message.trim());
      if (success) {
        setMessage('');
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiClick = () => {
    // Simple emoji picker - could be enhanced with a proper emoji picker library
    const emojis = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setMessage(prev => prev + randomEmoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={handleEmojiClick}
          disabled={disabled}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || sending || disabled}
          className="flex-shrink-0 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {sending && (
        <div className="mt-2 text-sm text-gray-500 flex items-center">
          <div className="w-4 h-4 mr-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          Sending...
        </div>
      )}
    </div>
  );
};