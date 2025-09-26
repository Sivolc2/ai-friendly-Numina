import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';
import { PhotoStats } from '../types/interactions';
import { usePhotoInteractions } from '../hooks/usePhotoInteractions';
import { usePhotoRealtime } from '../hooks/usePhotoRealtime';
import { useAuth } from '../contexts/AuthContext';

interface PhotoInteractionBarProps {
  photoUrl: string;
  profileId: string;
  onCommentClick: () => void;
  onShareClick?: () => void;
  className?: string;
}

export const PhotoInteractionBar: React.FC<PhotoInteractionBarProps> = ({
  photoUrl,
  profileId,
  onCommentClick,
  onShareClick,
  className = ''
}) => {
  const { userProfile } = useAuth();
  const { togglePhotoLove, getPhotoStats, loading } = usePhotoInteractions();
  const [stats, setStats] = useState<PhotoStats>({ loves: 0, comments: 0, userLoved: false });
  const [isAnimating, setIsAnimating] = useState(false);

  // Load photo stats on mount
  useEffect(() => {
    const loadStats = async () => {
      const photoStats = await getPhotoStats(photoUrl, profileId);
      if (photoStats) {
        setStats(photoStats);
      }
    };
    loadStats();
  }, [photoUrl, profileId, getPhotoStats]);

  // Set up real-time subscriptions
  usePhotoRealtime({
    photoUrl,
    profileId,
    onStatsUpdate: setStats,
    enabled: true
  });

  const handleLoveClick = async () => {
    if (!userProfile || loading) return;

    // Optimistic update
    const newUserLoved = !stats.userLoved;
    const newLoveCount = stats.loves + (newUserLoved ? 1 : -1);
    setStats(prev => ({
      ...prev,
      userLoved: newUserLoved,
      loves: newLoveCount
    }));

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Make API call
    const result = await togglePhotoLove(photoUrl, profileId);
    
    if (result && result.success) {
      // Update with actual server response
      setStats(prev => ({
        ...prev,
        userLoved: result.loved!,
        loves: result.loveCount!
      }));
    } else {
      // Revert on error
      setStats(prev => ({
        ...prev,
        userLoved: !newUserLoved,
        loves: stats.loves
      }));
    }
  };

  const formatCount = (count: number): string => {
    if (count === 0) return '';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
    return `${(count / 1000000).toFixed(1)}m`;
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-6">
        {/* Love Button */}
        <button
          onClick={handleLoveClick}
          disabled={loading || !userProfile}
          className="flex items-center space-x-2 group transition-all duration-200 disabled:opacity-50"
        >
          <div className={`relative transition-transform duration-300 ${isAnimating ? 'scale-125' : 'scale-100'}`}>
            <Heart
              className={`h-6 w-6 transition-colors duration-200 ${
                stats.userLoved
                  ? 'fill-red-500 text-red-500' 
                  : 'text-gray-600 group-hover:text-red-400'
              }`}
            />
            
            {/* Pulse animation on love */}
            {isAnimating && stats.userLoved && (
              <div className="absolute inset-0 animate-ping">
                <Heart className="h-6 w-6 fill-red-300 text-red-300 opacity-75" />
              </div>
            )}
          </div>
          
          {stats.loves > 0 && (
            <span className={`text-sm font-medium transition-colors ${
              stats.userLoved ? 'text-red-500' : 'text-gray-600'
            }`}>
              {formatCount(stats.loves)}
            </span>
          )}
        </button>

        {/* Comment Button */}
        <button
          onClick={onCommentClick}
          className="flex items-center space-x-2 group transition-colors duration-200 text-gray-600 hover:text-blue-500"
        >
          <MessageCircle className="h-6 w-6" />
          {stats.comments > 0 && (
            <span className="text-sm font-medium">
              {formatCount(stats.comments)}
            </span>
          )}
        </button>
      </div>

      {/* Share Button */}
      {onShareClick && (
        <button
          onClick={onShareClick}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <Share className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};