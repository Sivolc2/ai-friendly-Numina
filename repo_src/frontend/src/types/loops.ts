// ============================================================================
// LOOPS SYSTEM TYPE DEFINITIONS
// ============================================================================

// Loop is the top-level container for organizing events, communities, and other modules
export interface Loop {
  id: string;
  name: string;
  description: string;
  slug: string; // URL-friendly identifier (e.g., "tech-meetups")
  coverImage?: string;
  logoImage?: string;
  organizerId: string; // Profile ID of the loop owner
  organizationName?: string;
  
  // Module settings
  modulesEnabled: ModuleType[];
  primaryColor?: string;
  secondaryColor?: string;
  
  // Metadata
  memberCount: number;
  eventCount: number;
  communityCount: number;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
  
  // Relations
  organizer?: Profile;
  events?: LoopEvent[];
  communities?: Community[];
}

// Community is an ongoing group within a Loop
export interface Community {
  id: string;
  loopId: string;
  name: string;
  description: string;
  slug: string;
  coverImage?: string;
  
  // Community-specific fields
  startDate: string; // When the community was founded
  meetingFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'adhoc';
  meetingDay?: string; // e.g., "Monday", "First Tuesday"
  meetingTime?: string; // e.g., "18:00"
  meetingLocation?: string; // Default location for gatherings
  onlineLink?: string; // For virtual communities
  
  // Engagement
  memberCount: number;
  activeMembers: number; // Members active in last 30 days
  totalPhotos: number;
  discussionCount: number;
  
  // Access control
  isPrivate: boolean;
  requiresApproval: boolean;
  membershipFee?: number;
  
  // Metadata
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  
  // Relations
  loop?: Loop;
  members?: CommunityMember[];
  photos?: CommunityPhoto[];
}

// Enhanced Event type that belongs to a Loop
export interface LoopEvent {
  id: string;
  loopId: string;
  communityId?: string; // Optional - event can be part of a community
  
  // All existing Event fields
  name: string;
  location: string;
  date: string;
  endDate?: string; // For multi-day events
  description: string;
  coverImage: string;
  
  // Event metadata
  isPrivate: boolean;
  participantCount: number;
  maxParticipants?: number;
  waitlistCount?: number;
  
  // Event details
  agenda?: string;
  speakers?: Speaker[];
  sponsors?: Sponsor[];
  ticketPrice?: number;
  registrationDeadline?: string;
  
  // Organization
  tags: string[];
  eventType: 'meetup' | 'workshop' | 'conference' | 'social' | 'networking' | 'other';
  
  // Metadata
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  
  // Relations
  loop?: Loop;
  community?: Community;
  participants?: EventParticipant[];
}

// Community Member with role and activity tracking
export interface CommunityMember {
  id: string;
  communityId: string;
  profileId: string;
  
  // Member details
  role: 'admin' | 'moderator' | 'member' | 'guest';
  joinedAt: string;
  lastActiveAt?: string;
  
  // Engagement metrics
  eventsAttended: number;
  photosShared: number;
  discussionsStarted: number;
  commentsPosted: number;
  
  // Status
  isActive: boolean;
  isBanned: boolean;
  banReason?: string;
  
  // Relations
  community?: Community;
  profile?: Profile;
}

// Photos shared in a community
export interface CommunityPhoto {
  id: string;
  communityId: string;
  profileId: string;
  eventId?: string; // Optional - photo from a specific event
  
  photoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  
  // Engagement
  likeCount: number;
  commentCount: number;
  
  // Metadata
  uploadedAt: string;
  isApproved: boolean;
  isFeatured: boolean;
  
  // Relations
  community?: Community;
  profile?: Profile;
  event?: LoopEvent;
}

// Speaker for events
export interface Speaker {
  id: string;
  name: string;
  title: string;
  organization?: string;
  bio: string;
  photoUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}

// Sponsor for events
export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  sponsorshipLevel: 'platinum' | 'gold' | 'silver' | 'bronze' | 'partner';
}

// Module types that can be enabled in a Loop
export type ModuleType = 'events' | 'community' | 'workshops' | 'courses' | 'marketplace' | 'resources';

// Module configuration for extensibility
export interface ModuleConfig {
  type: ModuleType;
  enabled: boolean;
  permissions: {
    viewAccess: 'public' | 'members' | 'organizers';
    createAccess: 'organizers' | 'moderators' | 'members';
    moderateAccess: 'organizers' | 'moderators';
  };
  settings: Record<string, any>; // Module-specific settings
}

// Activity feed item for communities
export interface ActivityItem {
  id: string;
  communityId: string;
  actorId: string;
  actorName: string;
  
  activityType: 'joined' | 'posted_photo' | 'attended_event' | 'started_discussion' | 'commented' | 'liked';
  targetType?: 'photo' | 'event' | 'discussion' | 'comment';
  targetId?: string;
  targetTitle?: string;
  
  createdAt: string;
}

// Re-export Profile type if needed
import { Profile, Event, EventParticipant } from '../types';
export type { Profile, EventParticipant };