import React from 'react';

interface ConversationSkeletonProps {
  count?: number;
}

export const ConversationSkeleton: React.FC<ConversationSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="p-3 animate-pulse">
          <div className="flex items-center space-x-3">
            {/* Avatar skeleton */}
            <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                {/* Name skeleton */}
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                {/* Time skeleton */}
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
              {/* Message preview skeleton */}
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};