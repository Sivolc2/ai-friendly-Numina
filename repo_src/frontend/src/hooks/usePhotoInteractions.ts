import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PhotoComment, PhotoLove, PhotoStats, PhotoInteractionResult } from '../types/interactions';

export const usePhotoInteractions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get photo statistics (love count, comment count, user's love status)
  const getPhotoStats = useCallback(async (photoUrl: string, profileId: string): Promise<PhotoStats | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_photo_stats', {
        p_photo_url: photoUrl,
        p_profile_id: profileId
      });

      if (error) throw error;
      return data as PhotoStats;
    } catch (err) {
      console.error('Error fetching photo stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch photo stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle love (love/unlove)
  const togglePhotoLove = useCallback(async (photoUrl: string, profileId: string): Promise<PhotoInteractionResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('toggle_photo_love', {
        p_photo_url: photoUrl,
        p_profile_id: profileId
      });

      if (error) throw error;
      return data as PhotoInteractionResult;
    } catch (err) {
      console.error('Error toggling photo love:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle love');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get comments for a photo
  const getPhotoComments = useCallback(async (photoUrl: string, profileId: string): Promise<PhotoComment[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('photo_comments')
        .select(`
          *,
          commenter_profile:commenter_profile_id (
            id,
            name,
            cover_photo
          )
        `)
        .eq('photo_url', photoUrl)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const comments: PhotoComment[] = data.map(comment => ({
        id: comment.id,
        photoUrl: comment.photo_url,
        profileId: comment.profile_id,
        commenterProfileId: comment.commenter_profile_id,
        commentText: comment.comment_text,
        parentCommentId: comment.parent_comment_id,
        isEdited: comment.is_edited,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        commenterProfile: comment.commenter_profile ? {
          id: comment.commenter_profile.id,
          name: comment.commenter_profile.name,
          coverPhoto: comment.commenter_profile.cover_photo
        } : undefined
      }));

      return comments;
    } catch (err) {
      console.error('Error fetching photo comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a comment to a photo
  const addPhotoComment = useCallback(async (
    photoUrl: string, 
    profileId: string, 
    commenterProfileId: string,
    commentText: string
  ): Promise<PhotoComment | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('photo_comments')
        .insert([{
          photo_url: photoUrl,
          profile_id: profileId,
          commenter_profile_id: commenterProfileId,
          comment_text: commentText
        }])
        .select(`
          *,
          commenter_profile:commenter_profile_id (
            id,
            name,
            cover_photo
          )
        `)
        .single();

      if (error) throw error;

      const comment: PhotoComment = {
        id: data.id,
        photoUrl: data.photo_url,
        profileId: data.profile_id,
        commenterProfileId: data.commenter_profile_id,
        commentText: data.comment_text,
        parentCommentId: data.parent_comment_id,
        isEdited: data.is_edited,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        commenterProfile: data.commenter_profile ? {
          id: data.commenter_profile.id,
          name: data.commenter_profile.name,
          coverPhoto: data.commenter_profile.cover_photo
        } : undefined
      };

      return comment;
    } catch (err) {
      console.error('Error adding photo comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get users who loved a photo
  const getPhotoLovers = useCallback(async (photoUrl: string, profileId: string): Promise<PhotoLove[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('photo_loves')
        .select(`
          *,
          lover_profile:lover_profile_id (
            id,
            name,
            cover_photo
          )
        `)
        .eq('photo_url', photoUrl)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loves: PhotoLove[] = data.map(love => ({
        id: love.id,
        photoUrl: love.photo_url,
        profileId: love.profile_id,
        loverProfileId: love.lover_profile_id,
        createdAt: love.created_at,
        loverProfile: love.lover_profile ? {
          id: love.lover_profile.id,
          name: love.lover_profile.name,
          coverPhoto: love.lover_profile.cover_photo
        } : undefined
      }));

      return loves;
    } catch (err) {
      console.error('Error fetching photo lovers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lovers');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPhotoStats,
    togglePhotoLove,
    getPhotoComments,
    addPhotoComment,
    getPhotoLovers
  };
};