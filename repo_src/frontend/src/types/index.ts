// Main types for the Numina application

export type View =
  | 'discover'
  | 'directory'
  | 'slideshow'
  | 'profile'
  | 'community'
  | 'community-list'
  | 'user-profile'
  | 'settings'
  | 'admin'
  | 'upload'
  | 'messages'
  | 'complete-profile'
  | 'edit-profile'
  | 'auth-callback'
  | 'password-reset'
  | 'invitation'
  | 'feedback';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  story: string;
  coverPhoto: string;
  photos: string[];
  mainPhoto: string;
  socialLinks: Record<string, string>;
  customLinks: Array<{
    title: string;
    url: string;
  }>;
  messengerPlatforms: Record<string, string>;
  tags: string[];
  eventId: string;
  location: string;
  isPublic: boolean;
  hasCompletedProfile: boolean;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  tags: string[];
  coverPhoto: string;
  location: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export type Event = Community; // Legacy alias for backward compatibility

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  website?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}