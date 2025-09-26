import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Heart, MessageCircle } from 'lucide-react';
import { PhotoComment } from '../types/interactions';
import { usePhotoInteractions } from '../hooks/usePhotoInteractions';
import { useAuth } from '../contexts/AuthContext';

interface PhotoCommentsModalProps {
  photoUrl: string;
  profileId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatsUpdate?: (loves: number, comments: number) => void;
}

export const PhotoCommentsModal: React.FC<PhotoCommentsModalProps> = ({
  photoUrl,
  profileId,
  isOpen,
  onClose,
  onStatsUpdate
}) => {
  const { userProfile } = useAuth();
  const { getPhotoComments, addPhotoComment, loading } = usePhotoInteractions();
  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load comments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadComments();
      // Focus input after a short delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, photoUrl, profileId]);

  const loadComments = async () => {
    const commentData = await getPhotoComments(photoUrl, profileId);
    setComments(commentData);
    
    // Update parent with comment count
    if (onStatsUpdate) {
      onStatsUpdate(0, commentData.length); // We don't have loves here, just pass 0
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userProfile || submitting) return;

    setSubmitting(true);
    const comment = await addPhotoComment(photoUrl, profileId, userProfile.id, newComment.trim());
    
    if (comment) {
      setComments(prev => [...prev, comment]);
      setNewComment('');
      
      // Update parent with new comment count
      if (onStatsUpdate) {
        onStatsUpdate(0, comments.length + 1);
      }
    }
    
    setSubmitting(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && comments.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <MessageCircle className="h-12 w-12 mx-auto mb-2" />
              </div>
              <p className="text-gray-500">No comments yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {comment.commenterProfile?.coverPhoto ? (
                    <img
                      src={comment.commenterProfile.coverPhoto}
                      alt={comment.commenterProfile.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-600">
                        {comment.commenterProfile?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {comment.commenterProfile?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {comment.commentText}
                    </p>
                  </div>
                  
                  {/* Comment Actions */}
                  <div className="flex items-center space-x-4 mt-1 ml-1">
                    <button className="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>Love</span>
                    </button>
                    <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {userProfile?.coverPhoto ? (
                <img
                  src={userProfile.coverPhoto}
                  alt={userProfile.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-purple-600">
                    {userProfile?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>

            {/* Input Field */}
            <div className="flex-1 flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                disabled={submitting || !userProfile}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting || !userProfile}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
          
          {!userProfile && (
            <p className="text-xs text-gray-500 mt-2">
              Sign in to comment
            </p>
          )}
        </div>
      </div>
    </div>
  );
};