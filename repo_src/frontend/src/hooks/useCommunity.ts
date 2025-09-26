import { useState, useCallback } from 'react';
import { Community } from '../types';

// Mock community data
const mockCommunities: Community[] = [
  {
    id: '1',
    name: 'Tech Innovators',
    description: 'A community for technology professionals to share ideas and collaborate.',
    tags: ['Technology', 'Innovation', 'Collaboration'],
    coverPhoto: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    location: 'San Francisco, CA',
    organizationId: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Creative Minds',
    description: 'A space for designers, artists, and creative professionals to connect.',
    tags: ['Design', 'Art', 'Creativity'],
    coverPhoto: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
    location: 'New York, NY',
    organizationId: '1',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
];

export function useCommunity() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setCommunities(mockCommunities);
      return mockCommunities;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    communities,
    loading,
    fetchCommunities,
    setCommunities
  };
}