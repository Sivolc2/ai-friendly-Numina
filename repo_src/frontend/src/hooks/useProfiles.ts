import { useState, useCallback } from 'react';
import { Profile } from '../types';

// Mock profile data
const mockProfiles: Profile[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Software Engineer',
    story: 'Passionate about building user-friendly applications and solving complex problems.',
    coverPhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800',
    photos: [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'
    ],
    mainPhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/alice',
      github: 'https://github.com/alice'
    },
    customLinks: [],
    messengerPlatforms: {},
    tags: ['React', 'TypeScript', 'Node.js'],
    eventId: '1',
    location: 'San Francisco, CA',
    isPublic: true,
    hasCompletedProfile: true,
    videoUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'Product Designer',
    story: 'Creating delightful user experiences through thoughtful design and research.',
    coverPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
    ],
    mainPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    socialLinks: {
      dribbble: 'https://dribbble.com/bob',
      behance: 'https://behance.net/bob'
    },
    customLinks: [],
    messengerPlatforms: {},
    tags: ['UI/UX', 'Figma', 'Design Systems'],
    eventId: '1',
    location: 'New York, NY',
    isPublic: true,
    hasCompletedProfile: true,
    videoUrl: '',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    name: 'Carol Chen',
    email: 'carol@example.com',
    role: 'Data Scientist',
    story: 'Turning data into insights and building machine learning models that make a difference.',
    coverPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800',
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400'
    ],
    mainPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/carol',
      twitter: 'https://twitter.com/carol'
    },
    customLinks: [],
    messengerPlatforms: {},
    tags: ['Python', 'Machine Learning', 'Analytics'],
    eventId: '2',
    location: 'Austin, TX',
    isPublic: true,
    hasCompletedProfile: true,
    videoUrl: '',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  }
];

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProfiles(mockProfiles);
      return mockProfiles;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfilePhotos = useCallback(async (profileId: string) => {
    console.log('Fetching photos for profile:', profileId);
    // Mock implementation
    return [];
  }, []);

  return {
    profiles,
    loading,
    fetchProfiles,
    fetchProfilePhotos,
    setProfiles
  };
}