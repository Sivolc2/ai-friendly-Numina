import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, ChevronDown, ChevronUp, User, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProfileVersion } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ProfileVersionHistoryProps {
  profileId: string;
  currentProfile: any;
  onRestore: (versionId: string) => void;
}

export const ProfileVersionHistory: React.FC<ProfileVersionHistoryProps> = ({ 
  profileId, 
  currentProfile,
  onRestore 
}) => {
  const [versions, setVersions] = useState<ProfileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Manual test function to create a version
  const createTestVersion = async () => {
    console.log('Creating test version...');
    
    // Prompt for version name
    const versionName = window.prompt('Name this test version:') || 'Test version';
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/create_profile_version`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            p_profile_id: profileId,
            p_change_summary: versionName,
            p_version_type: 'manual',
            p_created_by: user?.id || null
          })
        }
      );
      
      const result = await response.json();
      console.log('Test version creation result:', result);
      
      if (response.ok) {
        alert('Test version created! Refreshing...');
        fetchVersions();
      } else {
        alert('Failed to create test version: ' + JSON.stringify(result));
      }
    } catch (error) {
      console.error('Error creating test version:', error);
      alert('Error creating test version');
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [profileId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      console.log('=== FETCHING PROFILE VERSIONS ===');
      console.log('Profile ID:', profileId);
      
      // Use direct API call to bypass RLS
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profile_versions?profile_id=eq.${profileId}&order=version_number.desc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      console.log('Direct API versions query result:', data);
      console.log('Number of versions found:', data?.length || 0);

      if (!response.ok) {
        console.error('Error fetching versions:', response.status, data);
        return;
      }

      // Map database fields to TypeScript interface
      const mappedVersions: ProfileVersion[] = (data || []).map(v => ({
        id: v.id,
        profileId: v.profile_id,
        versionNumber: v.version_number,
        name: v.name,
        email: v.email,
        role: v.role,
        story: v.story,
        coverPhoto: v.cover_photo,
        photos: v.photos,
        mainPhoto: v.main_photo,
        socialLinks: v.social_links,
        tags: v.tags,
        location: v.location,
        isPublic: v.is_public,
        hasCompletedProfile: v.has_completed_profile,
        videoUrl: v.video_url,
        createdAt: v.created_at,
        createdBy: v.created_by,
        changeSummary: v.change_summary,
        versionType: v.version_type
      }));

      setVersions(mappedVersions);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? Your current profile will be backed up.')) {
      return;
    }

    setRestoring(versionId);
    try {
      // Call the restore function via RPC
      const { error } = await supabase.rpc('restore_profile_version', {
        p_version_id: versionId,
        p_restored_by: user?.id || null
      });

      if (error) {
        console.error('Error restoring version:', error);
        alert('Failed to restore version. Please try again.');
        return;
      }

      alert('Version restored successfully!');
      onRestore(versionId);
      fetchVersions(); // Refresh the list
    } catch (error) {
      console.error('Error restoring version:', error);
      alert('Failed to restore version. Please try again.');
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVersionTypeLabel = (type: string) => {
    switch (type) {
      case 'auto':
        return 'Automatic Backup';
      case 'restore':
        return 'Restore Point';
      default:
        return 'Manual Save';
    }
  };

  const getVersionTypeColor = (type: string) => {
    switch (type) {
      case 'auto':
        return 'bg-gray-100 text-gray-700';
      case 'restore':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  const compareWithCurrent = (version: ProfileVersion) => {
    const changes = [];
    
    if (version.name !== currentProfile.name) {
      changes.push(`Name: "${version.name}" → "${currentProfile.name}"`);
    }
    if (version.story !== currentProfile.story) {
      changes.push('Story updated');
    }
    if (version.photos.length !== currentProfile.photos.length) {
      changes.push(`Photos: ${version.photos.length} → ${currentProfile.photos.length}`);
    }
    if (version.mainPhoto !== currentProfile.mainPhoto) {
      changes.push('Main photo changed');
    }
    if (JSON.stringify(version.socialLinks) !== JSON.stringify(currentProfile.socialLinks)) {
      changes.push('Social links updated');
    }
    if ((version.tags || []).join(',') !== (currentProfile.tags || []).join(',')) {
      changes.push('Tags updated');
    }
    
    return changes;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-purple-600" />
              Version History
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {versions.length} version{versions.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            onClick={createTestVersion}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Create Test Version
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No version history yet</p>
            <p className="text-sm mt-1">Versions will appear here after your first edit</p>
          </div>
        ) : (
          versions.map((version) => {
            const isExpanded = expandedVersion === version.id;
            const changes = compareWithCurrent(version);
            const isCurrentVersion = version.versionNumber === Math.max(...versions.map(v => v.versionNumber));
            
            return (
              <div key={version.id} className="hover:bg-gray-50">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          Version {version.versionNumber}{version.changeSummary ? `: ${version.changeSummary}` : ''}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getVersionTypeColor(version.versionType)}`}>
                          {getVersionTypeLabel(version.versionType)}
                        </span>
                        {isCurrentVersion && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                            Latest
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(version.createdAt)}
                        </span>
                        {version.createdBy && (
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            By user
                          </span>
                        )}
                      </div>
                      
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!isCurrentVersion && (
                        <button
                          onClick={() => handleRestore(version.id)}
                          disabled={restoring === version.id}
                          className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {restoring === version.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              <span>Restoring...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-3 w-3" />
                              <span>Restore</span>
                            </>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Version Details</h4>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">Name:</span>
                            <p className="text-gray-900">{version.name}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Photos:</span>
                            <p className="text-gray-900">{version.photos.length} photos</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Tags:</span>
                            <p className="text-gray-900">{(version.tags || []).length} tags</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Privacy:</span>
                            <p className="text-gray-900">{version.isPublic ? 'Public' : 'Private'}</p>
                          </div>
                        </div>
                        
                        {version.story && (
                          <div className="mt-3">
                            <span className="text-gray-500">Story Preview:</span>
                            <p className="text-gray-900 mt-1 line-clamp-3">{version.story}</p>
                          </div>
                        )}
                      </div>
                      
                      {changes.length > 0 && !isCurrentVersion && (
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 mb-2">Changes from this version:</h4>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {changes.map((change, idx) => (
                              <li key={idx}>• {change}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Versions are automatically created before each edit. Keep up to 15 versions per profile.
        </p>
      </div>
    </div>
  );
};