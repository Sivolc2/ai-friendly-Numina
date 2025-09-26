import React from 'react';
import { ArrowLeft, MapPin, MessageCircle, ExternalLink, Mail } from 'lucide-react';
import { Profile } from '../types';

interface ProfileViewProps {
  profile: Profile;
  onBack: () => void;
  onNavigateToChat: (profileId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onBack,
  onNavigateToChat
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600">
          {profile.coverPhoto && (
            <img
              src={profile.coverPhoto}
              alt={`${profile.name}'s cover`}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/30 transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <div className="flex items-end space-x-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white border-4 border-white">
              {profile.mainPhoto ? (
                <img
                  src={profile.mainPhoto}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 text-2xl font-semibold">
                    {profile.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="text-white flex-1">
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <p className="text-xl opacity-90">{profile.role}</p>
              {profile.location && (
                <div className="flex items-center mt-2 opacity-80">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={() => onNavigateToChat(profile.id)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Message</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{profile.story}</p>
            </div>

            {/* Photos Grid */}
            {profile.photos && profile.photos.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-200 hover:scale-105 transition-transform cursor-pointer"
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {profile.videoUrl && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Video</h2>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    src={profile.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Social Links */}
            {Object.keys(profile.socialLinks).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
                <div className="space-y-3">
                  {Object.entries(profile.socialLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <span className="capitalize">{platform}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Links */}
            {profile.customLinks && profile.customLinks.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>
                <div className="space-y-3">
                  {profile.customLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{profile.email}</span>
                </div>
                {Object.entries(profile.messengerPlatforms).map(([platform, handle]) => (
                  <div key={platform} className="flex items-center text-gray-600">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <span className="capitalize">{platform}: {handle}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};