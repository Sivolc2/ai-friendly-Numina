// View types for navigation
export type View = 
  | 'slideshow'
  | 'directory'
  | 'discover'
  | 'community-list'
  | 'profile'
  | 'community'
  | 'user-profile'
  | 'settings'
  | 'complete-profile'
  | 'edit-profile'
  | 'auth-callback'
  | 'password-reset'
  | 'admin'
  | 'upload'
  | 'invitation'
  | 'messages'
  | 'feedback';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  story: string;
  coverPhoto: string;
  photos: string[];
  mainPhoto?: string; // Selected main photo for directory display
  socialLinks: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
    website?: string;
  };
  customLinks?: Array<{
    name: string;
    url: string;
  }>;
  messengerPlatforms?: {
    whatsapp?: string;
    telegram?: string;
    wechat?: string;
    line?: string;
    signal?: string;
  };
  tags: string[];
  answers?: Answer[]; // Question answers for this profile
  eventId: string; // Changed back from communityId to match database field
  location: string;
  isPublic: boolean;
  hasCompletedProfile: boolean;
  publishedProfile?: boolean;
  createdAt: string;
  updatedAt?: string; // When the profile was last modified
  videoUrl?: string;
  // New photographer and organization fields
  photographerTier?: 'verified' | 'partner' | 'featured';
  canInvite?: boolean;
  organizationId?: string;
  // Hierarchical system fields
  parentOrganiserId?: string; // ID of the organiser who manages this user
  invitedBy?: string; // ID of the user who invited this user
  organizationName?: string; // Name of the organization (for organisers)
  invitationAcceptedAt?: string; // When invitation was accepted
}

export interface Community {
  id: string;
  name: string;
  location: string;
  date: string;
  description: string;
  coverImage: string;
  isPrivate: boolean;
  participantCount: number;
  tags: string[];
  userId?: string; // ID of the user who created the community
  // New organization and series fields
  organizationId?: string;
  communitySeries?: string; // "Monthly Meetup", "Annual Conference"
  sequenceNumber?: number; // 1st, 2nd, 3rd in series
}

// Legacy alias for backward compatibility during transition
export type Event = Community;
export type EventParticipant = CommunityParticipant;

export interface Question {
  id: string;
  category: 'Story & Values' | 'Joy & Humanity' | 'Passion & Dreams' | 'Optional Fun' | 'Connection';
  questionText: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: string;
  profileId: string;
  questionId: string;
  answerText: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  tagName: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadSession {
  id: string;
  communityId: string;
  photos: File[];
  participants: {
    email: string;
    role: string;
    photoIndexes: number[];
  }[];
  status: 'pending' | 'processing' | 'completed';
}

export interface ProfileVersion {
  id: string;
  profileId: string;
  versionNumber: number;
  name: string;
  email: string;
  role: string;
  story: string;
  coverPhoto: string;
  photos: string[];
  mainPhoto?: string;
  socialLinks: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  tags: string[];
  location: string;
  isPublic: boolean;
  hasCompletedProfile: boolean;
  videoUrl?: string;
  createdAt: string;
  createdBy?: string;
  changeSummary?: string;
  versionType: 'manual' | 'auto' | 'restore';
}

export interface AnswerVersion {
  id: string;
  profileVersionId: string;
  questionId: string;
  answerText: string;
  createdAt: string;
}

// New interfaces for organizations and invitations

export interface Organization {
  id: string;
  name: string;
  description?: string;
  organizationType: 'meetup' | 'club' | 'nonprofit' | 'company' | 'conference';
  website?: string;
  location?: string;
  coverImage?: string;
  adminProfileId: string;
  isActive: boolean;
  memberCount: number;
  communityCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  communityId?: string; // Optional - for community-specific invites
  organizationId?: string;
  inviterId: string;
  inviteeEmail: string;
  invitationToken: string; // Changed from invitationCode for consistency
  invitationType: 'community_participant' | 'organization_member' | 'photographer' | 'organiser';
  status: 'pending' | 'accepted' | 'expired' | 'declined';
  personalMessage?: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
  // Populated relations
  community?: Community;
  organization?: Organization;
  inviter?: Profile;
}

export interface CommunityParticipant {
  id: string;
  communityId: string;
  profileId: string;
  participationType: 'attendee' | 'speaker' | 'organizer' | 'photographer';
  invitedBy?: string;
  invitationId?: string;
  joinedAt: string;
  // Populated relations
  community?: Community;
  profile?: Profile;
  inviter?: Profile;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  profileId: string;
  memberType: 'admin' | 'organizer' | 'regular_member' | 'first_timer';
  firstCommunityId?: string;
  communitiesAttended: number;
  lastCommunityAttended?: string;
  joinedAt: string;
  // Populated relations
  organization?: Organization;
  profile?: Profile;
  firstCommunity?: Community;
}

// Message and Conversation types
export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  participantPhotos: string[];
  lastMessageContent?: string;
  lastMessageSenderId?: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  createdAt: string;
  editedAt?: string;
  isDeleted: boolean;
  // Populated relations
  sender?: Profile;
}

// Feedback system types
export interface FeedbackTicket {
  id: string;
  userId?: string; // Optional for non-member submissions
  contactEmail?: string; // For non-member submissions
  type: 'bug' | 'feature' | 'feedback' | 'member';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  attachmentUrls?: string[];
  userAgent?: string;
  pageUrl?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  // Populated relations
  user?: Profile;
  resolver?: Profile;
}

export interface FeedbackStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  bugCount: number;
  featureCount: number;
  feedbackCount: number;
  memberCount: number;
  avgResolutionTimeHours: number;
}

// Slideshow settings types
export interface SlideshowSettings {
  kenBurnsEnabled: boolean;
  interval: number; // milliseconds (3000, 5000, 7000, 10000)
  animationSpeed: 'fast' | 'medium' | 'slow'; // 3s, 5s, 7s
  filterType: 'all' | 'community' | 'organization';
  selectedCommunityId?: string;
  selectedOrganization?: string;
  version: number; // for settings migration
}

export type SlideshowInterval = 3000 | 5000 | 7000 | 10000;
export type AnimationSpeed = 'fast' | 'medium' | 'slow';
export type FilterType = 'all' | 'community' | 'organization';

// Re-export interaction types
export type { PhotoComment, PhotoLove, PhotoStats, PhotoInteractionResult } from './interactions';