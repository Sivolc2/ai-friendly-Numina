// Main application types for the Numina backend

export interface Profile {
  id: string
  name: string
  email: string
  role: string
  story: string
  coverPhoto: string
  photos: string[]
  mainPhoto?: string
  socialLinks: {
    linkedin?: string
    instagram?: string
    twitter?: string
    youtube?: string
    facebook?: string
    website?: string
  }
  customLinks?: Array<{
    name: string
    url: string
  }>
  messengerPlatforms?: {
    whatsapp?: string
    telegram?: string
    wechat?: string
    line?: string
    signal?: string
  }
  tags: string[]
  eventId?: string
  location: string
  isPublic: boolean
  hasCompletedProfile: boolean
  publishedProfile?: boolean
  createdAt: string
  updatedAt?: string
  videoUrl?: string
  photographerTier?: 'verified' | 'partner' | 'featured'
  canInvite?: boolean
  organizationId?: string
  parentOrganiserId?: string
  invitedBy?: string
  organizationName?: string
  invitationAcceptedAt?: string
  // AI story generation fields
  storyAnswers?: string
  joyHumanityAnswers?: string
  passionDreamsAnswers?: string
  connectionPreferencesAnswers?: string
  openEndedAnswer?: string
  aiGeneratedAt?: string
}

export interface Community {
  id: string
  name: string
  location: string
  date: string
  description: string
  coverImage: string
  isPrivate: boolean
  participantCount: number
  tags: string[]
  userId?: string
  organizationId?: string
  communitySeries?: string
  sequenceNumber?: number
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  category: 'Story & Values' | 'Joy & Humanity' | 'Passion & Dreams' | 'Optional Fun' | 'Connection'
  questionText: string
  displayOrder: number
  isRequired: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Answer {
  id: string
  profileId: string
  questionId: string
  answerText: string
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  tagName: string
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface FormSetting {
  id: string
  settingKey: string
  settingValue: string
  description?: string
  createdAt: string
  updatedAt: string
}

// API Request/Response types

export interface GenerateStoryRequest {
  profileId: string
  name: string
  location: string
  storyAnswers: string
  joyHumanityAnswers: string
  passionDreamsAnswers: string
  connectionPreferencesAnswers: string
  openEndedAnswer?: string
  interestTags: string[]
}

export interface GenerateStoryResponse {
  success: boolean
  story?: string
  profile?: Profile
  tokenLimit?: number
  contentSections?: number
  error?: string
  provider?: string
}

export interface SendEmailRequest {
  to: string
  subject: string
  html: string
  type: 'profile_invitation' | 'profile_completion' | 'event_notification'
  eventName?: string
  profileUrl?: string
  eventUrl?: string
}

export interface SendEmailResponse {
  success: boolean
  emailId?: string
  message?: string
  error?: string
}

// Utility types
export type DatabaseTables = 'profiles' | 'communities' | 'questions' | 'answers' | 'tags' | 'form_settings'

export type ProfileRole = 'member' | 'organizer' | 'photographer' | 'admin' | 'super_admin' | 'founder' | 'ceo'

export type AIProvider = 'openai' | 'gemini'

export type EmailType = 'profile_invitation' | 'profile_completion' | 'event_notification'