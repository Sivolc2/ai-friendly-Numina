import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
};

export const ProfileCardSkeleton: React.FC<{ isPhotographicMode?: boolean }> = ({ 
  isPhotographicMode = false 
}) => {
  return (
    <div className={
      isPhotographicMode 
        ? "overflow-hidden rounded-lg" 
        : "bg-white rounded-xl shadow-sm overflow-hidden"
    }>
      <div className={
        isPhotographicMode 
          ? "relative aspect-square" 
          : "relative"
      }>
        <Skeleton className={
          isPhotographicMode 
            ? "w-full h-full" 
            : "w-full h-64"
        } />
        
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      
      {!isPhotographicMode && (
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-1">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex space-x-1">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const EventCardSkeleton: React.FC<{ isPhotographicMode?: boolean }> = ({ 
  isPhotographicMode = false 
}) => {
  return (
    <div className={
      isPhotographicMode 
        ? "overflow-hidden rounded-lg" 
        : "bg-white rounded-xl shadow-sm overflow-hidden"
    }>
      <div className={
        isPhotographicMode 
          ? "relative aspect-square" 
          : "relative h-48"
      }>
        <Skeleton className="w-full h-full" />
        
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      
      {!isPhotographicMode && (
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          
          <div className="space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          
          <div className="flex space-x-1 pt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export const DirectorySkeletonGrid: React.FC<{ 
  count?: number; 
  viewMode?: 'photographic' | 'directory';
  type?: 'profiles' | 'events';
}> = ({ 
  count = 6, 
  viewMode = 'photographic',
  type = 'profiles'
}) => {
  const isPhotographic = viewMode === 'photographic';
  const SkeletonComponent = type === 'profiles' ? ProfileCardSkeleton : EventCardSkeleton;
  
  return (
    <div className={`grid gap-6 ${
      isPhotographic 
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    }`}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonComponent 
          key={index} 
          isPhotographicMode={isPhotographic}
        />
      ))}
    </div>
  );
};