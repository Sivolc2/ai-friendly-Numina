import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Profile,
  Community,
  Event, // Legacy alias
  Question,
  Answer,
  Tag,
  FormSetting,
  Invitation
} from '../types';
import { useAuth } from '../contexts/AuthContext';
// Image compression removed - uploading original files directly
import {
  createProfileInvitationEmail,
  createProfileCompletionEmail,
  createEventNotificationEmail
} from '../lib/emailTemplates';
// Image optimization imports removed - uploading original files directly

export const useData = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [events, setEvents] = useState<Event[]>([]); // Legacy alias
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [formSettings, setFormSettings] = useState<FormSetting[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);
  const { user, isSuperAdmin } = useAuth();

  const fetchProfiles = useCallback(async () => {
    console.log('=== FETCHING PROFILES ===');
    try {
      console.log('Using Supabase client to fetch profiles...');
      
      // For super admin, fetch ALL profiles; for others, apply filters
      let query = supabase
        .from('profiles')
        .select('id,name,email,role,story,main_photo,cover_photo,social_links,custom_links,messenger_platforms,event_id,location,is_public,has_completed_profile,video_url,created_at,updated_at,published_profile,photos');
      
      // Only apply filters if NOT super admin
      if (!isSuperAdmin) {
        query = query
          .eq('is_public', true)
          .eq('has_completed_profile', true)
          .eq('published_profile', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      console.log('Query executed, error:', error);
      console.log('Query executed, data:', data);
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Supabase fetch completed, profiles found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('First profile sample:', data[0]);
      }

      const mappedProfiles = (data || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        story: profile.story,
        coverPhoto: profile.cover_photo,
        photos: Array.isArray(profile.photos) ? profile.photos : [],
        mainPhoto: profile.main_photo,
        socialLinks: profile.social_links || {},
        customLinks: profile.custom_links || [],
        messengerPlatforms: profile.messenger_platforms || {},
        tags: [], // Load tags separately if needed
        eventId: profile.event_id,
        location: profile.location,
        isPublic: profile.is_public,
        hasCompletedProfile: profile.has_completed_profile,
        videoUrl: profile.video_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }));

      console.log(`Fetched ${mappedProfiles.length} profiles successfully`);
      setProfiles(mappedProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      console.log('Setting profiles to empty array due to error');
      setProfiles([]); // Set empty array so loading completes
    }
  }, [isSuperAdmin]);

  const fetchAllProfilesForAdmin = useCallback(async () => {
    console.log('=== FETCHING ALL PROFILES FOR ADMIN ===');
    try {
      console.log('Using Supabase client to fetch ALL profiles for admin...');
      
      // Fetch ALL profiles for admin view, including incomplete ones with photos and hierarchy fields
      const { data, error } = await supabase
        .from('profiles')
        .select('id,name,email,role,story,main_photo,cover_photo,photos,social_links,custom_links,messenger_platforms,event_id,location,is_public,has_completed_profile,video_url,created_at,updated_at,published_profile,parent_organiser_id,invited_by,organization_name,invitation_accepted_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Supabase admin fetch completed, profiles found:', data?.length || 0);

      const mappedProfiles = (data || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        story: profile.story,
        coverPhoto: profile.cover_photo,
        photos: Array.isArray(profile.photos) ? profile.photos : (profile.photos ? [profile.photos] : []),
        mainPhoto: profile.main_photo,
        socialLinks: profile.social_links || {},
        customLinks: profile.custom_links || [],
        messengerPlatforms: profile.messenger_platforms || {},
        tags: [], // Load tags separately if needed
        eventId: profile.event_id,
        location: profile.location,
        isPublic: profile.is_public,
        hasCompletedProfile: profile.has_completed_profile,
        publishedProfile: profile.published_profile,
        videoUrl: profile.video_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        // Hierarchical system fields
        parentOrganiserId: profile.parent_organiser_id,
        invitedBy: profile.invited_by,
        organizationName: profile.organization_name,
        invitationAcceptedAt: profile.invitation_accepted_at
      }));

      console.log(`Mapped ${mappedProfiles.length} profiles for admin successfully`);
      setProfiles(mappedProfiles);
      return mappedProfiles;
    } catch (error) {
      console.error('Error fetching admin profiles:', error);
      console.log('Setting profiles to empty array due to error');
      setProfiles([]); // Set empty array so loading completes
      return [];
    }
  }, []);

  const fetchProfilePhotos = useCallback(async (profileId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('photos')
        .eq('id', profileId)
        .single();

      if (error) {
        throw error;
      }

      return data?.photos || [];
    } catch (error) {
      console.error('Error fetching profile photos:', error);
      return [];
    }
  }, []);

  const fetchCommunities = useCallback(async () => {
    try {
      // Fetch all events/communities with specific fields
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          location,
          date,
          description,
          cover_image,
          is_private,
          participant_count,
          tags,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedCommunities = (data || []).map(community => ({
        id: community.id,
        name: community.name,
        location: community.location,
        date: community.date,
        description: community.description,
        coverImage: community.cover_image,
        isPrivate: community.is_private,
        participantCount: community.participant_count,
        tags: Array.isArray(community.tags) ? community.tags : (typeof community.tags === 'string' && community.tags ? (() => {
          try {
            return JSON.parse(community.tags);
          } catch (e) {
            console.warn('Failed to parse community tags:', community.tags, e);
            return [];
          }
        })() : []),
        userId: community.user_id
      }));

      console.log(`Fetched ${mappedCommunities.length} communities ${isSuperAdmin ? '(super admin view)' : user ? '(hierarchical view)' : '(public view)'}`);
      setCommunities(mappedCommunities);
      setEvents(mappedCommunities); // Also update legacy alias
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  }, [isSuperAdmin, user]); // Removed getTeamMembers to avoid circular dependency

  const fetchQuestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('display_order');

      if (error) throw error;

      const mappedQuestions = (data || []).map(question => ({
        id: question.id,
        category: question.category,
        questionText: question.question_text,
        displayOrder: question.display_order,
        isRequired: question.is_required,
        isActive: question.is_active,
        createdAt: question.created_at,
        updatedAt: question.updated_at
      }));

      setQuestions(mappedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  }, []);

  const fetchAllQuestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('category')
        .order('display_order');

      if (error) throw error;

      const mappedQuestions = (data || []).map(question => ({
        id: question.id,
        category: question.category,
        questionText: question.question_text,
        displayOrder: question.display_order,
        isRequired: question.is_required,
        isActive: question.is_active,
        createdAt: question.created_at,
        updatedAt: question.updated_at
      }));

      setQuestions(mappedQuestions);
    } catch (error) {
      console.error('Error fetching all questions:', error);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('tag_name');

      if (error) throw error;

      const mappedTags = (data || []).map(tag => ({
        id: tag.id,
        tagName: tag.tag_name,
        createdAt: tag.created_at,
        updatedAt: tag.updated_at
      }));

      setTags(mappedTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, []);

  const fetchFormSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('form_settings')
        .select('*');

      if (error) throw error;

      const mappedSettings = (data || []).map(setting => ({
        id: setting.id,
        settingKey: setting.setting_key,
        settingValue: setting.setting_value,
        createdAt: setting.created_at,
        updatedAt: setting.updated_at
      }));

      setFormSettings(mappedSettings);
    } catch (error) {
      console.error('Error fetching form settings:', error);
    }
  }, []);

  const uploadImage = async (file: File, bucket: string = 'photos'): Promise<string> => {
    console.log('=== STARTING IMAGE UPLOAD (NO COMPRESSION) ===');
    console.log('File name:', file.name);
    console.log('File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Target bucket:', bucket);
    
    // Retry function with exponential backoff
    const uploadWithRetry = async (attempt: number = 1, maxRetries: number = 3): Promise<string> => {
      try {
        // Generate a unique filename keeping original extension
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${bucket}/${fileName}`;
        
        console.log(`Attempt ${attempt}: Generated file path:`, filePath);
        console.log(`Attempt ${attempt}: Uploading original file directly...`);
        const uploadStart = Date.now();
        
        // Upload original file directly to Supabase Storage (no compression)
        const uploadPromise = supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '31536000', // Cache for 1 year (images rarely change)
            upsert: false
          });
        
        // Increase timeout to 60 seconds for slower connections
        const uploadTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Supabase upload timeout after 60 seconds (attempt ${attempt})`)), 60000)
        );
        
        const { error } = await Promise.race([uploadPromise, uploadTimeout]) as any;
          
        console.log(`Supabase upload completed in ${Date.now() - uploadStart}ms`);
          
        if (error) {
          console.error(`Upload error on attempt ${attempt}:`, error);
          throw error;
        }
        
        console.log('Getting public URL...');
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
          
        console.log('Upload successful! Public URL:', publicUrl);
        console.log('=== IMAGE UPLOAD COMPLETE ===');
        
        return publicUrl;
        
      } catch (error) {
        console.error(`Upload attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return uploadWithRetry(attempt + 1, maxRetries);
        }
        
        // All retries failed
        throw new Error(`Upload failed after ${maxRetries} attempts. Last error: ${error.message}`);
      }
    };
    
    try {
      return await uploadWithRetry();
    } catch (error) {
      console.error('=== IMAGE UPLOAD FAILED ===');
      console.error('Error uploading image:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  const createCommunity = async (communityData: Omit<Community, 'id' | 'createdAt' | 'participantCount'>) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { data, error } = await supabase
        .from('events') // Still using events table until DB migration
        .insert([{
          name: communityData.name,
          location: communityData.location,
          date: communityData.date,
          description: communityData.description,
          cover_image: communityData.coverImage,
          is_private: communityData.isPrivate,
          tags: communityData.tags,
          user_id: user.id,
          participant_count: 0
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchCommunities();
      return data;
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  };

  // Legacy alias for backward compatibility
  const createEvent = createCommunity;

  const updateCommunity = async (communityId: string, communityData: Partial<Community>) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { data, error } = await supabase
        .from('events') // Still using events table until DB migration
        .update({
          name: communityData.name,
          location: communityData.location,
          date: communityData.date,
          description: communityData.description,
          cover_image: communityData.coverImage,
          is_private: communityData.isPrivate,
          tags: communityData.tags
        })
        .eq('id', communityId)
        .select()
        .single();

      if (error) throw error;
      await fetchCommunities();
      return data;
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  };

  const deleteCommunity = async (communityId: string) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { error } = await supabase
        .from('events') // Still using events table until DB migration
        .delete()
        .eq('id', communityId);

      if (error) throw error;
      await fetchCommunities();
    } catch (error) {
      console.error('Error deleting community:', error);
      throw error;
    }
  };

  // Legacy aliases for backward compatibility
  const updateEvent = updateCommunity;
  const deleteEvent = deleteCommunity;

  const createProfile = async (profileData: Omit<Profile, 'id' | 'createdAt'> & { id?: string }) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: profileData.id || user.id, // Use provided ID or auth user ID for clean system
          user_id: user.id, // Also set user_id to satisfy RLS policies
          name: profileData.name,
          email: profileData.email,
          role: profileData.role,
          story: profileData.story,
          cover_photo: profileData.coverPhoto,
          photos: profileData.photos,
          main_photo: profileData.mainPhoto,
          social_links: profileData.socialLinks,
          custom_links: profileData.customLinks,
          messenger_platforms: profileData.messengerPlatforms,
          event_id: profileData.eventId,
          location: profileData.location,
          is_public: profileData.isPublic,
          has_completed_profile: profileData.hasCompletedProfile,
          published_profile: profileData.publishedProfile || false,
          video_url: profileData.videoUrl,
          // Hierarchical system fields
          parent_organiser_id: profileData.parentOrganiserId,
          invited_by: profileData.invitedBy,
          organization_name: profileData.organizationName,
          invitation_accepted_at: profileData.invitationAcceptedAt
        }])
        .select('*, completion_token')
        .single();

      if (error) throw error;
      
      // Update tags separately
      if (profileData.tags.length > 0) {
        await updateProfileTags(data.id, profileData.tags);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  const updateProfileTags = async (profileId: string, tagNames: string[]) => {
    try {
      // First, delete existing tags for this profile
      await supabase
        .from('user_tags')
        .delete()
        .eq('profile_id', profileId);

      // Then, add new tags
      for (const tagName of tagNames) {
        // Ensure tag exists
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('tag_name', tagName)
          .single();

        if (!existingTag) {
          const { data: newTag } = await supabase
            .from('tags')
            .insert({ tag_name: tagName })
            .select()
            .single();
          existingTag = newTag;
        }

        if (existingTag) {
          await supabase
            .from('user_tags')
            .insert({
              profile_id: profileId,
              tag_id: existingTag.id
            });
        }
      }
    } catch (error) {
      console.error('Error updating profile tags:', error);
      throw error;
    }
  };

  const sendEmail = async (
    to: string,
    subject: string,
    html: string,
    type: 'profile_invitation' | 'profile_completion' | 'event_notification',
    metadata?: {
      eventName?: string;
      profileUrl?: string;
      eventUrl?: string;
    }
  ) => {
    console.log('=== SENDING EMAIL ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Type:', type);
    console.log('Metadata:', metadata);
    
    try {
      console.log('Invoking send-email edge function...');
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to,
          subject,
          html,
          type,
          ...metadata
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        // Check if it's a RESEND_API_KEY error
        if (error.message?.includes('RESEND_API_KEY')) {
          throw new Error('Email service not configured. Please contact support.');
        }
        throw error;
      }
      
      // Check if the response indicates an error
      if (data && !data.success) {
        console.error('Email sending failed:', data.error);
        if (data.error?.includes('RESEND_API_KEY')) {
          throw new Error('Email service not configured. Please contact support.');
        }
        throw new Error(data.error || 'Failed to send email');
      }
      
      console.log('Email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('=== EMAIL SENDING FAILED ===');
      console.error('Error sending email:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Provide user-friendly error messages
      if (error.message?.includes('Email service not configured')) {
        throw error; // Re-throw the friendly error
      }
      if (error.message?.includes('NetworkError')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  };

  const sendProfileInvitationEmail = async (
    email: string,
    participantName: string,
    eventName: string,
    profileId: string,
    eventId: string,
    completionToken?: string // Kept for backward compatibility, but unused
  ) => {
    // Use correct production URL for emails
    const baseUrl = import.meta.env.VITE_PUBLIC_APP_URL || 'https://www.numina.cam';
    const profileUrl = `${baseUrl}/profile/${profileId}`;
    const eventUrl = `${baseUrl}/event/${eventId}`;
    
    const template = createProfileInvitationEmail(
      participantName,
      eventName,
      profileUrl,
      eventUrl,
      null // Token authentication removed
    );

    return sendEmail(
      email,
      template.subject,
      template.html,
      'profile_invitation',
      {
        eventName,
        profileUrl,
        eventUrl
      }
    );
  };

  const sendProfileCompletionEmail = async (
    email: string,
    participantName: string,
    profileUrl: string
  ) => {
    const template = createProfileCompletionEmail(
      participantName,
      profileUrl
    );

    return sendEmail(
      email,
      template.subject,
      template.html,
      'profile_completion',
      {
        profileUrl
      }
    );
  };

  const sendEventNotificationEmail = async (
    email: string,
    eventName: string,
    eventUrl: string,
    participantName: string
  ) => {
    const template = createEventNotificationEmail(
      eventName,
      eventUrl,
      participantName
    );

    return sendEmail(
      email,
      template.subject,
      template.html,
      'event_notification',
      {
        eventName,
        eventUrl
      }
    );
  };

  const fetchAnswersByProfileId = async (profileId: string): Promise<Answer[]> => {
    console.log('=== FETCHING ANSWERS DEBUG ===');
    console.log('Profile ID:', profileId);
    
    try {
      console.log('Using direct API fetch for answers...');
      const startTime = Date.now();
      
      // Use direct API call like we do for profiles
      const response = await Promise.race([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/answers?profile_id=eq.${profileId}&select=*`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Accept': 'application/json',
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Direct API timeout after 10 seconds')), 10000)
        )
      ]);

      const queryTime = Date.now() - startTime;
      console.log(`Direct API completed in ${queryTime}ms`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Direct API data count:', data?.length || 0);

      const mappedAnswers = (data || []).map(answer => ({
        id: answer.id,
        profileId: answer.profile_id,
        questionId: answer.question_id,
        answerText: answer.answer_text,
        createdAt: answer.created_at,
        updatedAt: answer.updated_at
      }));
      
      console.log('Returning mapped answers:', mappedAnswers.length);
      return mappedAnswers;
    } catch (error) {
      console.error('Error fetching answers:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message
      });
      throw error;
    }
  };

  const saveAnswer = async (profileId: string, questionId: string, answerText: string) => {
    try {
      const { error } = await supabase
        .from('answers')
        .upsert({
          profile_id: profileId,
          question_id: questionId,
          answer_text: answerText,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'profile_id,question_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    }
  };

  const createQuestion = async (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          category: questionData.category,
          question_text: questionData.questionText,
          display_order: questionData.displayOrder,
          is_required: questionData.isRequired,
          is_active: questionData.isActive
        })
        .select()
        .single();

      if (error) throw error;
      await fetchQuestions();
      return data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  };

  const updateQuestion = async (id: string, updates: Partial<Question>) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          category: updates.category,
          question_text: updates.questionText,
          display_order: updates.displayOrder,
          is_required: updates.isRequired,
          is_active: updates.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await fetchQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  };

  const createTag = async (tagName: string) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ tag_name: tagName })
        .select()
        .single();

      if (error) throw error;
      await fetchTags();
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  };

  const updateFormSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('form_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;
      await fetchFormSettings();
    } catch (error) {
      console.error('Error updating form setting:', error);
      throw error;
    }
  };

  const generateAIStory = async (
    profileId: string, 
    name: string, 
    location: string, 
    storyAnswers: string, 
    joyAnswers: string, 
    passionAnswers: string, 
    connectionAnswers: string, 
    tags: string[]
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-story', {
        body: {
          profileId,
          name,
          location,
          storyAnswers,
          joyHumanityAnswers: joyAnswers,
          passionDreamsAnswers: passionAnswers,
          connectionPreferencesAnswers: connectionAnswers,
          interestTags: tags
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating AI story:', error);
      throw error;
    }
  };

  const updateUserRole = async (profileId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (error) throw error;
      await fetchProfiles();
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  // Invitation management functions
  const fetchInvitations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedInvitations = (data || []).map(invitation => ({
        id: invitation.id,
        eventId: invitation.event_id,
        organizationId: invitation.organization_id,
        inviterId: invitation.inviter_id,
        inviteeEmail: invitation.invitee_email,
        invitationToken: invitation.invitation_code,
        invitationType: (invitation.role || invitation.invitation_type || 'photographer') as 'photographer' | 'organiser' | 'event_participant' | 'organization_member',
        status: (invitation.status || 'pending') as 'pending' | 'accepted' | 'expired' | 'declined',
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
        acceptedAt: invitation.accepted_at
      }));

      setInvitations(mappedInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  }, []);

  const generateInvitationToken = () => {
    return `inv_${Math.random().toString(36).substring(2)}_${Date.now().toString(36)}`;
  };

  const createInvitation = async (email: string, role: 'photographer' | 'organiser', personalMessage?: string) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const token = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data, error } = await supabase
        .from('invitations')
        .insert([{
          inviter_id: user.id,
          invitee_email: email,
          role: role,
          invitation_code: token,
          invitation_type: role,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          event_id: '00000000-0000-0000-0000-000000000000' // Placeholder for hierarchy invites
        }])
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      await sendInvitationEmail(email, role, token, personalMessage);
      await fetchInvitations();
      
      return data;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  };

  const sendInvitationEmail = async (
    email: string,
    role: 'photographer' | 'organiser',
    token: string,
    personalMessage?: string
  ) => {
    const baseUrl = import.meta.env.VITE_PUBLIC_APP_URL || 'https://www.numina.cam';
    const signupUrl = `${baseUrl}/signup?token=${token}`;
    const inviterName = user?.user_metadata?.name || user?.email || 'Team member';
    
    const subject = `Invitation to join ${inviterName}'s photography team`;
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #7C3AED;">You're invited to join our photography team!</h2>
        
        <p>Hi there,</p>
        
        <p><strong>${inviterName}</strong> has invited you to join their photography team as a <strong>${role}</strong>.</p>
        
        ${personalMessage ? `<div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${personalMessage}"</p>
        </div>` : ''}
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${signupUrl}" 
             style="background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Accept Invitation & Sign Up
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This invitation will expire in 7 days. If you're not interested, you can safely ignore this email.
        </p>
        
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          Sent by Numina Photography Platform
        </p>
      </div>
    `;

    return sendEmail(email, subject, html, 'profile_invitation');
  };

  const acceptInvitation = async (token: string, userData: {
    name: string;
    password: string;
    organizationName?: string;
  }) => {
    try {
      // First, verify the invitation token
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('invitation_code', token)
        .single();

      if (inviteError || !invitation) {
        throw new Error('Invalid or expired invitation token');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      if (invitation.accepted_at) {
        throw new Error('Invitation has already been accepted');
      }

      // Create the user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.invitee_email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: invitation.role || invitation.invitation_type,
            invited_by: invitation.inviter_id
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      // Create the profile with hierarchical data
      const profileData = {
        id: authData.user.id,
        name: userData.name,
        email: invitation.invitee_email,
        role: invitation.role || invitation.invitation_type,
        parentOrganiserId: invitation.inviter_id,
        invitedBy: invitation.inviter_id,
        organizationName: userData.organizationName,
        invitationAcceptedAt: new Date().toISOString(),
        story: '',
        coverPhoto: '',
        photos: [],
        socialLinks: {},
        tags: [],
        eventId: '', // Will be assigned later
        location: '',
        isPublic: false,
        hasCompletedProfile: false,
        createdAt: new Date().toISOString()
      };

      await createProfile(profileData);

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({ 
          accepted_at: new Date().toISOString(),
          status: 'accepted'
        })
        .eq('invitation_code', token);

      await fetchInvitations();
      return authData;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  };

  const validateInvitationToken = async (token: string) => {
    try {
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*, inviter:profiles!inviter_id(name, organization_name)')
        .eq('invitation_code', token)
        .single();

      if (error || !invitation) {
        return { valid: false, error: 'Invalid invitation token' };
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return { valid: false, error: 'Invitation has expired' };
      }

      if (invitation.accepted_at) {
        return { valid: false, error: 'Invitation has already been accepted' };
      }

      return { 
        valid: true, 
        invitation: {
          email: invitation.invitee_email,
          role: invitation.role || invitation.invitation_type,
          inviterName: invitation.inviter?.name,
          organizationName: invitation.inviter?.organization_name,
          expiresAt: invitation.expires_at
        }
      };
    } catch (error) {
      console.error('Error validating invitation token:', error);
      return { valid: false, error: 'Failed to validate invitation' };
    }
  };

  const getTeamMembers = useCallback(async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('parent_organiser_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        parentOrganiserId: profile.parent_organiser_id,
        invitedBy: profile.invited_by,
        organizationName: profile.organization_name,
        invitationAcceptedAt: profile.invitation_accepted_at,
        hasCompletedProfile: profile.has_completed_profile,
        createdAt: profile.created_at,
        // Add other required Profile fields with defaults
        story: profile.story || '',
        coverPhoto: profile.cover_photo || '',
        photos: profile.photos || [],
        socialLinks: profile.social_links || {},
        customLinks: profile.custom_links || [],
        messengerPlatforms: profile.messenger_platforms || {},
        tags: [],
        eventId: profile.event_id || '',
        location: profile.location || '',
        isPublic: profile.is_public || false,
        publishedProfile: profile.published_profile,
        videoUrl: profile.video_url
      }));
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }, [user]);

  const revokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      await fetchInvitations();
    } catch (error) {
      console.error('Error revoking invitation:', error);
      throw error;
    }
  };

  useEffect(() => {
    // ✅ Only run once per mount
    console.log('useData useEffect triggered, hasFetchedInitialData:', hasFetchedInitialData);
    if (hasFetchedInitialData) return;

    const loadData = async () => {
      console.log('Starting data load...');
      setLoading(true);
      
      // Load data with individual timeouts to prevent any single function from blocking
      const results = await Promise.allSettled([
        Promise.race([fetchProfiles(), new Promise(resolve => setTimeout(() => resolve(null), 10000))]),
        Promise.race([fetchCommunities(), new Promise(resolve => setTimeout(() => resolve(null), 10000))]),
        Promise.race([fetchQuestions(), new Promise(resolve => setTimeout(() => resolve(null), 10000))]),
        Promise.race([fetchTags(), new Promise(resolve => setTimeout(() => resolve(null), 10000))]),
        Promise.race([fetchFormSettings(), new Promise(resolve => setTimeout(() => resolve(null), 10000))])
      ]);
      
      console.log('Data loading completed with results:', results);
      console.log('Results statuses:', results.map(r => r.status));
      setLoading(false);
      setHasFetchedInitialData(true);
    };

    loadData();
  }, [hasFetchedInitialData, fetchProfiles, fetchCommunities, fetchQuestions, fetchTags, fetchFormSettings]);

  return {
    profiles,
    communities,
    events, // Legacy alias
    questions,
    tags,
    formSettings,
    invitations,
    loading,
    fetchProfiles,
    fetchAllProfilesForAdmin,
    fetchProfilePhotos,
    fetchCommunities,
    fetchEvents: fetchCommunities, // Legacy alias
    fetchQuestions,
    fetchAllQuestions,
    fetchTags,
    fetchFormSettings,
    fetchInvitations,
    fetchAnswersByProfileId,
    saveAnswer,
    updateProfileTags,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    createTag,
    deleteTag,
    updateFormSetting,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    createEvent, // Legacy alias
    updateEvent, // Legacy alias  
    deleteEvent, // Legacy alias
    createProfile,
    uploadImage,
    sendProfileInvitationEmail,
    sendProfileCompletionEmail,
    sendEventNotificationEmail,
    generateAIStory,
    updateUserRole,
    // Invitation management functions
    createInvitation,
    acceptInvitation,
    validateInvitationToken,
    getTeamMembers,
    revokeInvitation
  };
};