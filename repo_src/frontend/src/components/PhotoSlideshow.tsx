import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Eye } from 'lucide-react';
import { Profile, Community } from '../types';

interface PhotoSlideshowProps {
  profiles: Profile[];
  events: Community[];
  onViewProfile: (profile: Profile) => void;
  onOpenApp: () => void;
}

export const PhotoSlideshow: React.FC<PhotoSlideshowProps> = ({
  profiles,
  onViewProfile,
  onOpenApp
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Get all photos from profiles
  const allPhotos = profiles.flatMap(profile =>
    profile.photos.map(photo => ({
      url: photo,
      profile
    }))
  );

  useEffect(() => {
    if (!isPlaying || allPhotos.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allPhotos.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, allPhotos.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allPhotos.length);
  };

  if (allPhotos.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl mb-4">No photos available</h2>
          <button
            onClick={onOpenApp}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open App
          </button>
        </div>
      </div>
    );
  }

  const currentPhoto = allPhotos[currentIndex];

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Main Image */}
      <div className="relative h-full">
        <img
          src={currentPhoto.url}
          alt="Slideshow"
          className="w-full h-full object-cover"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Controls Overlay */}
      <div className="absolute inset-0 flex items-center justify-between p-6">
        {/* Left Arrow */}
        <button
          onClick={goToPrevious}
          className="text-white/80 hover:text-white transition-colors p-2"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={goToNext}
          className="text-white/80 hover:text-white transition-colors p-2"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="flex items-center justify-between">
          {/* Profile Info */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20">
              <img
                src={currentPhoto.profile.mainPhoto || currentPhoto.url}
                alt={currentPhoto.profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-white">
              <h3 className="font-semibold">{currentPhoto.profile.name}</h3>
              <p className="text-sm opacity-80">{currentPhoto.profile.role}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-white/20 backdrop-blur text-white p-3 rounded-full hover:bg-white/30 transition-colors"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>

            <button
              onClick={() => onViewProfile(currentPhoto.profile)}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>View Profile</span>
            </button>

            <button
              onClick={onOpenApp}
              className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
            >
              Open App
            </button>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex space-x-1 mt-4">
          {allPhotos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/40 w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};