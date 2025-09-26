import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Camera, Save, Upload, X, Plus, ExternalLink, ChevronRight, ChevronLeft, History } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Profile, Question, Answer } from '../types';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { profileEvents } from '../utils/profileEvents';
import { ProfileVersionHistory } from './ProfileVersionHistory';

interface ProfileCompletionProps {
  profileId: string;
  onComplete: () => void;
  editMode?: boolean;
}

export const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ profileId, onComplete, editMode = false }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'step6' | 'step7' | 'step8' | 'step9' | 'step10'>('step1');
  const [connectTabEnabled, setConnectTabEnabled] = useState(true);
  const [generatingStory, setGeneratingStory] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    story: '',
    answers: {} as Record<string, string>,
    selectedQuestions: {} as Record<string, string[]>, // category -> questionIds
    openEndedAnswer: '', // New field for the final open-ended question
    socialLinks: {
      linkedin: '',
      instagram: '',
      twitter: '',
      youtube: '',
      facebook: '',
      website: ''
    },
    customLinks: [
      { name: '', url: '' },
      { name: '', url: '' },
      { name: '', url: '' },
      { name: '', url: '' },
      { name: '', url: '' }
    ],
    messengerPlatforms: {
      whatsapp: '',
      telegram: '',
      wechat: '',
      line: '',
      signal: ''
    },
    tags: [] as string[],
    selectedPhotos: [] as string[],
    mainPhoto: '' as string,
    isPublic: true,  // Default to public for new profiles
    photoConsent: true,  // Default to consent for better UX
    promotionalConsent: true
  });
  
  const [newTag, setNewTag] = useState('');
  const { 
    questions: allQuestions, 
    tags: allTags, 
    formSettings,
    fetchAnswersByProfileId, 
    saveAnswer, 
    updateProfileTags,
    uploadImage, 
    sendProfileCompletionEmail, 
    generateAIStory 
  } = useData();
  const { user, signUp, refreshProfile } = useAuth();

  // Use useLayoutEffect for immediate scroll to top when component mounts
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [profileId, editMode]);

  // Additional scroll when loading completes
  useEffect(() => {
    if (!loading) {
      setTimeout(() => window.scrollTo(0, 0), 50);
      setTimeout(() => window.scrollTo(0, 0), 200);
    }
  }, [loading]);

  // Scroll to top when current step changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  // Check if Connect tab is enabled
  useEffect(() => {
    const connectSetting = formSettings.find(s => s.settingKey === 'connect_tab_enabled');
    if (connectSetting) {
      setConnectTabEnabled(connectSetting.settingValue === 'true');
    }
  }, [formSettings]);

  useEffect(() => {
    let isMounted = true;
    
    const loadProfile = async () => {
      if (!isMounted) return;
      
      console.log('Loading profile with ID:', profileId);
      
      if (!profileId) {
        console.error('No profile ID provided');
        setLoading(false);
        return;
      }
      
      // Skip test query and go straight to the main query
      try {
        // Use direct fetch instead of Supabase client which is hanging
        console.log('Fetching profile with direct API call...');
        const fetchResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${profileId}&select=*`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });
        
        console.log('Direct fetch response:', fetchResponse);
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        
        const profileData = await fetchResponse.json();
        console.log('Profile data from API:', profileData);
        
        const data = profileData[0]; // API returns array, get first item
        const error = !data ? { message: 'Profile not found' } : null;
        
        console.log('Processed result:', { data, error });
        
        if (error) {
          console.error('Error fetching profile:', error);
          setLoading(false);
          return;
        }

        if (!data) {
          console.error('Profile not found');
          setLoading(false);
          return;
        }

        console.log('Profile found:', data);
        
        // SECURITY FIX: Validate current session matches profile being completed
        if (!editMode && data.email) {
          console.log('🔒 Validating session for profile completion...');
          
          // Check current session
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (currentUser && currentUser.email) {
            console.log('Current session user:', currentUser.email);
            console.log('Profile being completed:', data.email);
            
            // If emails don't match, sign out and reload
            if (currentUser.email.toLowerCase() !== data.email.toLowerCase()) {
              console.warn('⚠️ SECURITY: Session mismatch! Signing out current user.');
              console.log(`User ${currentUser.email} attempting to complete profile for ${data.email}`);
              
              // Sign out the mismatched user
              await supabase.auth.signOut();
              
              // Clear all session data
              localStorage.removeItem('supabase.auth.token');
              sessionStorage.clear();
              
              // Reload the page to ensure clean state
              window.location.href = `/?complete=${profileId}`;
              return;
            }
            
            console.log('✅ Session validated - emails match');
          }
        }
        
        // Map database columns to frontend interface
        const fetchedProfile: any = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          story: data.story || '',
          coverPhoto: data.cover_photo || '',
          photos: data.photos || [],
          mainPhoto: data.main_photo || '',
          socialLinks: data.social_links || {},
          customLinks: data.custom_links || [
            { name: '', url: '' },
            { name: '', url: '' },
            { name: '', url: '' },
            { name: '', url: '' },
            { name: '', url: '' }
          ],
          messengerPlatforms: data.messenger_platforms || {
            whatsapp: '',
            telegram: '',
            wechat: '',
            line: '',
            signal: ''
          },
          tags: [], // Tags need to be loaded separately since we're using direct fetch
          eventId: data.event_id,
          location: data.location || '',
          isPublic: data.is_public,
          hasCompletedProfile: data.has_completed_profile,
          publishedProfile: data.published_profile, // Add this field
          videoUrl: data.video_url || '',
          photoConsent: data.photo_consent ?? false,
          promotionalConsent: data.promotional_consent ?? false,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        
        setProfile(fetchedProfile);
        
        // Load tags separately
        try {
          const tagsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_tags?profile_id=eq.${profileId}&select=tag_id,tags(tag_name)`, {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Accept': 'application/json'
            }
          });
          
          if (tagsResponse.ok) {
            const userTags = await tagsResponse.json();
            const tagNames = userTags.map((ut: any) => ut.tags?.tag_name).filter(Boolean);
            fetchedProfile.tags = tagNames;
            setProfile({ ...fetchedProfile });
          }
        } catch (tagError) {
          console.error('Error loading tags:', tagError);
        }
        
        // Load existing answers using direct fetch
        try {
          console.log('Loading answers...');
          const answersResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/answers?profile_id=eq.${profileId}`, {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Accept': 'application/json'
            }
          });
          
          if (answersResponse.ok) {
            const answersData = await answersResponse.json();
            console.log('Answers loaded:', answersData);
            const existingAnswers = answersData.map((answer: any) => ({
              id: answer.id,
              profileId: answer.profile_id,
              questionId: answer.question_id,
              answerText: answer.answer_text,
              createdAt: answer.created_at,
              updatedAt: answer.updated_at
            }));
            setAnswers(existingAnswers);
            
            // Convert answers to form data format
            const answersMap: Record<string, string> = {};
            const selectedQuestionsMap: Record<string, string[]> = {};
            
            existingAnswers.forEach(answer => {
              answersMap[answer.questionId] = answer.answerText;
              
              // Also populate selectedQuestions based on which questions have answers
              const question = allQuestions.find(q => q.id === answer.questionId);
              if (question) {
                const category = question.category;
                if (!selectedQuestionsMap[category]) {
                  selectedQuestionsMap[category] = [];
                }
                if (!selectedQuestionsMap[category].includes(answer.questionId)) {
                  selectedQuestionsMap[category].push(answer.questionId);
                }
              }
            });
            
            // Update form data with loaded answers
            setFormData(prevData => ({
              ...prevData,
              answers: answersMap,
              selectedQuestions: selectedQuestionsMap
            }));
          }
        } catch (answerError) {
          console.error('Error loading answers:', answerError);
          setAnswers([]);
        }
        
        console.log('=== POPULATING FORM DATA ===');
        console.log('Fetched profile:', fetchedProfile);
        console.log('Social links from DB:', JSON.stringify(fetchedProfile.socialLinks, null, 2));
        console.log('Custom links from DB:', JSON.stringify(fetchedProfile.customLinks, null, 2));
        console.log('Messenger platforms from DB:', JSON.stringify(fetchedProfile.messengerPlatforms, null, 2));
        console.log('Setting form data with:', {
          name: fetchedProfile.name,
          role: fetchedProfile.role,
          story: fetchedProfile.story,
          socialLinks: fetchedProfile.socialLinks,
          customLinks: fetchedProfile.customLinks,
          messengerPlatforms: fetchedProfile.messengerPlatforms,
          tags: fetchedProfile.tags,
          selectedPhotos: fetchedProfile.photos, // Preselect all photos - users can deselect any they don't want
          mainPhoto: fetchedProfile.mainPhoto || fetchedProfile.coverPhoto || fetchedProfile.photos[0] || '',
          isPublic: fetchedProfile.isPublic ?? false,
          photoConsent: fetchedProfile.photoConsent ?? false,
          promotionalConsent: fetchedProfile.promotionalConsent ?? false
        });

        setFormData(prevData => ({
          ...prevData,
          name: fetchedProfile.name,
          role: fetchedProfile.role,
          story: fetchedProfile.story,
          selectedQuestions: {},
          socialLinks: fetchedProfile.socialLinks,
          customLinks: fetchedProfile.customLinks,
          messengerPlatforms: fetchedProfile.messengerPlatforms,
          tags: fetchedProfile.tags,
          selectedPhotos: fetchedProfile.photos, // Preselect all photos - users can deselect any they don't want
          mainPhoto: fetchedProfile.mainPhoto || fetchedProfile.coverPhoto || fetchedProfile.photos[0] || '',
          isPublic: fetchedProfile.isPublic ?? false,
          photoConsent: fetchedProfile.photoConsent ?? false,
          promotionalConsent: fetchedProfile.promotionalConsent ?? false
        }));

        // Skip complex authentication for now - let the save process handle auth
        console.log('Skipping authentication setup - will handle in save process');
        
        // Finally set loading to false
        if (isMounted) {
          setLoading(false);
          setAuthenticating(false);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        console.error('Error details:', error);
        if (isMounted) {
          setLoading(false);
          setAuthenticating(false);
        }
      }
    };

    loadProfile();
    
    return () => {
      isMounted = false;
    };
  }, [profileId]);

  // Load questions and tags directly
  useEffect(() => {
    const loadQuestionsAndTags = async () => {
      try {
        // Load questions
        console.log('Loading questions...');
        const questionsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/questions?is_active=eq.true&order=category,display_order`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Accept': 'application/json'
          }
        });
        
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          console.log('Questions loaded:', questionsData);
          const mappedQuestions = questionsData.map((q: any) => ({
            id: q.id,
            category: q.category,
            questionText: q.question_text,
            displayOrder: q.display_order,
            isRequired: q.is_required,
            isActive: q.is_active,
            createdAt: q.created_at,
            updatedAt: q.updated_at
          }));
          setQuestions(mappedQuestions);
        }
        
        // Load tags
        console.log('Loading tags...');
        const tagsResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tags?order=tag_name`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Accept': 'application/json'
          }
        });
        
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          console.log('Tags loaded:', tagsData);
          setAvailableTags(tagsData.map((tag: any) => tag.tag_name));
        }
      } catch (error) {
        console.error('Error loading questions/tags:', error);
      }
    };
    
    loadQuestionsAndTags();
  }, []);

  const handleAnswerChange = (questionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value
      }
    }));
  };

  const toggleQuestionSelection = (category: string, questionId: string) => {
    setFormData(prev => {
      const categoryQuestions = prev.selectedQuestions[category] || [];
      const isSelected = categoryQuestions.includes(questionId);
      
      let newCategoryQuestions;
      if (isSelected) {
        newCategoryQuestions = categoryQuestions.filter(id => id !== questionId);
      } else {
        newCategoryQuestions = [...categoryQuestions, questionId];
      }
      
      return {
        ...prev,
        selectedQuestions: {
          ...prev.selectedQuestions,
          [category]: newCategoryQuestions
        }
      };
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleTagSelection = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(tag => tag !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  const togglePhotoSelection = (photoUrl: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPhotos: prev.selectedPhotos.includes(photoUrl)
        ? prev.selectedPhotos.filter(url => url !== photoUrl)
        : [...prev.selectedPhotos, photoUrl]
    }));
  };

  // Helper function to construct social media URLs from usernames
  const constructSocialUrl = (platform: string, username: string): string => {
    if (!username.trim()) return '';
    
    const cleanUsername = username.trim();
    
    // If it's already a full URL, return as-is (for backward compatibility)
    if (cleanUsername.startsWith('http://') || cleanUsername.startsWith('https://')) {
      return cleanUsername;
    }
    
    const baseUrls: Record<string, string> = {
      linkedin: 'https://linkedin.com/in/',
      instagram: 'https://instagram.com/',
      twitter: 'https://twitter.com/',
      youtube: 'https://youtube.com/@',
      facebook: 'https://facebook.com/'
    };
    
    return baseUrls[platform] ? baseUrls[platform] + cleanUsername : cleanUsername;
  };

  // Helper function to handle social media input changes
  const handleSocialMediaChange = (platform: string, value: string) => {
    const fullUrl = constructSocialUrl(platform, value);
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: fullUrl }
    }));
  };

  // Helper function to extract username from existing URL (for display in input)
  const extractUsernameFromUrl = (platform: string, url: string): string => {
    if (!url) return '';
    
    const baseUrls: Record<string, string> = {
      linkedin: 'https://linkedin.com/in/',
      instagram: 'https://instagram.com/',
      twitter: 'https://twitter.com/',
      youtube: 'https://youtube.com/@',
      facebook: 'https://facebook.com/'
    };
    
    const baseUrl = baseUrls[platform];
    if (baseUrl && url.startsWith(baseUrl)) {
      return url.replace(baseUrl, '');
    }
    
    // If it's not a standard URL format, return as-is
    return url;
  };

  const handleVersionRestore = async (versionId: string) => {
    console.log('Restoring version:', versionId);
    // Refresh the component after restore
    window.location.reload();
  };

  const handleGenerateStory = async () => {
    if (!profile) return;
    
    // Collect answers by category for AI generation
    const storyAnswers = questions
      .filter(q => q.category === 'Story & Values' && formData.answers[q.id])
      .map(q => `${q.questionText}: ${formData.answers[q.id]}`)
      .join('\n\n');
      
    const joyAnswers = questions
      .filter(q => q.category === 'Joy & Humanity' && formData.answers[q.id])
      .map(q => `${q.questionText}: ${formData.answers[q.id]}`)
      .join('\n\n');
      
    const passionAnswers = questions
      .filter(q => q.category === 'Passion & Dreams' && formData.answers[q.id])
      .map(q => `${q.questionText}: ${formData.answers[q.id]}`)
      .join('\n\n');
      
    const connectionAnswers = questions
      .filter(q => q.category === 'Connection' && formData.answers[q.id])
      .map(q => `${q.questionText}: ${formData.answers[q.id]}`)
      .join('\n\n');
    
    setGeneratingStory(true);
    try {
      console.log('Calling AI story generation from step:', currentStep);
      console.log('Connection answers being sent:', connectionAnswers);
      console.log('Final thoughts being sent:', formData.openEndedAnswer);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-story`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          name: formData.name,
          location: profile.location,
          storyAnswers,
          joyHumanityAnswers: joyAnswers,
          passionDreamsAnswers: passionAnswers,
          connectionPreferencesAnswers: connectionAnswers,
          openEndedAnswer: formData.openEndedAnswer,
          interestTags: formData.tags
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI story generation failed:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `HTTP error! status: ${response.status}`);
        } catch {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      const result = await response.json();
      console.log('AI story generated:', result);
      
      if (result.success && result.story) {
        setFormData(prev => ({
          ...prev,
          story: result.story
        }));
        alert('AI story generated successfully! You can review and edit it below.');
      } else {
        throw new Error('Failed to generate story');
      }
    } catch (error: any) {
      console.error('Error generating AI story:', error);
      
      // Check for specific error types
      if (error.message.includes('insufficient_quota')) {
        alert('AI story generation is temporarily unavailable due to quota limits. Please write your story manually in the text area below.');
      } else {
        alert('Failed to generate AI story. Please try again or write your story manually.');
      }
    } finally {
      setGeneratingStory(false);
    }
  };

  const handleSave = async (e?: React.MouseEvent) => {
    // Prevent any default form submission behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('=== STARTING PROFILE SAVE ===');
    const saveStartTime = Date.now();
    console.log('Profile ID:', profileId);
    console.log('Form data to save:', formData);
    
    let currentUser = null;
    let currentSession = null;
    let accountCreated = false;
    
    try {
      console.log('Getting current user and session...');
      const startAuth = Date.now();
      
      try {
        // Use Promise.race with timeout to prevent hanging
        const authPromise = Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession()
        ]);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout after 8 seconds')), 8000)
        );
        
        const [userResult, sessionResult] = await Promise.race([authPromise, timeoutPromise]);
        currentUser = userResult.data?.user || null;
        currentSession = sessionResult.data?.session || null;
        console.log(`Auth state fetched in ${Date.now() - startAuth}ms`);
      } catch (authError) {
        console.warn('Auth failed, proceeding without auth:', authError);
        currentUser = null;
        currentSession = null;
      }
    } catch (error) {
      console.error('Failed to get auth state:', error);
      currentUser = null;
      currentSession = null;
    }
    
    console.log('=== AUTHENTICATION STATUS ===');
    console.log('Current user:', currentUser);
    console.log('Current session:', currentSession);
    console.log('User authenticated:', !!currentUser);
    console.log('Session active:', !!currentSession);
    
    // Auto-create account if user is not authenticated and this is initial profile completion
    let randomPassword = '';
    if (!currentUser && profile && !editMode && !profile.hasCompletedProfile) {
      console.log('=== AUTO-CREATING ACCOUNT FOR PROFILE COMPLETION ===');
      console.log('Profile email:', profile.email);
      
      try {
        // Create a Supabase auth user with the profile email
        // Use a random password since they'll use magic links
        randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
        
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: profile.email,
          password: randomPassword,
          options: {
            // Don't send confirmation email as this is auto-creation
            emailRedirectTo: undefined
          }
        });
        
        if (signUpError) {
          console.error('Failed to create auth account:', signUpError);
          console.error('SignUp error details:', {
            message: signUpError.message,
            status: signUpError.status,
            code: signUpError.code
          });
          
          // Check if user already exists
          if (signUpError.message?.includes('already registered') || signUpError.message?.includes('User already registered')) {
            console.log('User already exists, attempting to sign in instead...');
            // Try to sign in with a magic link instead
            const { error: otpError } = await supabase.auth.signInWithOtp({
              email: profile.email,
              options: {
                emailRedirectTo: `${window.location.origin}/?complete=${profileId}`
              }
            });
            
            if (otpError) {
              console.error('Failed to send magic link:', otpError);
            } else {
              alert('An account already exists for this email. We\'ve sent you a magic link to sign in. Please check your email and click the link to continue.');
              setSaving(false);
              return;
            }
          }
          // Continue with profile completion even if account creation fails
        } else if (authData.user) {
          console.log('Auth account created successfully:', authData.user.id);
          currentUser = authData.user;
          accountCreated = true;
          
          // Link the profile to the new auth user
          const { error: linkError } = await supabase
            .from('profiles')
            .update({ 
              user_id: authData.user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', profileId);
          
          if (linkError) {
            console.error('Failed to link profile to auth user:', linkError);
          } else {
            console.log('✅ Profile linked to auth user successfully');
          }
          
          // Get the new session and ensure we're signed in
          const { data: sessionData } = await supabase.auth.getSession(); 
          currentSession = sessionData.session;
          
          // If we don't have a session, try to sign in with the created credentials
          if (!currentSession) {
            console.log('No session after signup, attempting to sign in...');
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: profile.email,
              password: randomPassword
            });
            if (signInData.user) {
              currentUser = signInData.user;
              currentSession = signInData.session;
              console.log('Successfully signed in with new account:', currentUser.id);
              
              // Refresh auth context after successful sign in
              try {
                await refreshProfile();
                console.log('Auth context refreshed after sign in');
                
                // Give the session time to establish
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Verify session is active
                const { data: { session: verifySession } } = await supabase.auth.getSession();
                if (verifySession) {
                  console.log('✅ Session verified after sign in:', verifySession.user?.email);
                }
              } catch (refreshError) {
                console.error('Failed to refresh auth context:', refreshError);
              }
            }
          }
        }
      } catch (accountError) {
        console.error('Error during account creation:', accountError);
        // Continue with profile completion even if account creation fails
      }
    } else if (!currentUser && profile && profile.hasCompletedProfile) {
      console.log('Profile already completed, skipping account creation. User should use magic link to sign in.');
    }
    
    setSaving(true);
    
    // Wrap everything in a master try-catch to prevent page reloads
    try {
      if (!profile) {
        console.error('No profile found, returning early');
        setSaving(false);
        return;
      }

      console.log('Current profile before update:', profile);
      
      console.log('=== SAVING ANSWERS ===');
      const startAnswers = Date.now();
      const answerEntries = Object.entries(formData.answers);
      console.log('Total answers to process:', answerEntries.length);
      console.log('Form data answers:', formData.answers);
      console.log('Answer entries:', answerEntries);
      
      if (answerEntries.length === 0) {
        console.log('No answers to save, skipping answer save step');
      } else {
        // Batch save all answers in one operation
        const answersToSave = answerEntries
          .filter(([_, answerText]) => answerText.trim())
          .map(([questionId, answerText]) => ({
            profile_id: profileId,
            question_id: questionId,
            answer_text: answerText,
            updated_at: new Date().toISOString()
          }));
        
        if (answersToSave.length > 0) {
          console.log(`Batch saving ${answersToSave.length} answers...`);
          console.log('Attempting to save answers:', answersToSave);
          
          try {
            // Add timeout to prevent hanging
            const supabasePromise = supabase
              .from('answers')
              .upsert(answersToSave, {
                onConflict: 'profile_id,question_id'
              });

            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Supabase answer save timeout after 30 seconds')), 30000)
            );

            const { error } = await Promise.race([supabasePromise, timeoutPromise]);

            if (error) {
              console.error('Database error saving answers:', error);
              console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
              });
              console.error('Attempted to save answers:', answersToSave);
              console.error('Current user context:', { 
                userId: currentUser?.id, 
                email: currentUser?.email,
                profileUserId: profile?.user_id,
                profileEmail: profile?.email
              });
              
              throw error; // This will trigger the catch block and fallback
            } else {
              console.log(`All ${answersToSave.length} answers saved successfully via Supabase client in ${Date.now() - startAnswers}ms`);
            }
          } catch (answerError) {
            console.error('Supabase client failed:', answerError);
            
            // Try direct API call as fallback
            console.log('Trying direct API call as fallback...');
            try {
              const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/answers?on_conflict=profile_id,question_id`, {
                method: 'POST',
                headers: {
                  'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'resolution=merge-duplicates,return=minimal'
                },
                body: JSON.stringify(answersToSave)
              });
              
              if (response.ok) {
                console.log(`Fallback API call succeeded - saved ${answersToSave.length} answers`);
                // Don't show error if fallback succeeded - data is saved
                console.log('Note: Primary save timed out but fallback succeeded - your data is saved!');
              } else {
                const errorText = await response.text();
                console.error('Fallback API call failed:', response.status, errorText);
                alert(`Failed to save answers via both methods:\n1. Supabase: ${answerError.message}\n2. API: ${errorText}`);
              }
            } catch (fallbackError) {
              console.error('Both Supabase client and direct API failed:', fallbackError);
              // Only show alert if both methods truly failed
              if (fallbackError.message !== 'Failed to fetch') {
                alert(`Failed to save answers: ${answerError.message}\nFallback also failed: ${fallbackError.message}`);
              } else {
                // Network error - likely CORS or connection issue, but data might still be saved
                console.warn('Network error during save - please refresh to verify your data was saved');
                alert('Connection issue detected. Your profile may have been saved successfully. Please refresh the page to verify.');
              }
            }
          }
        }
      }
      
      console.log('=== UPDATING PROFILE TAGS ===');
      console.log('Tags to update:', formData.tags);
      
      // Auto-add role-based tags based on the user's role
      const roleBasedTags = new Set(formData.tags);
      const roleLower = formData.role.toLowerCase();
      
      // Add tags based on role keywords
      if (roleLower.includes('founder') || roleLower.includes('co-founder')) {
        roleBasedTags.add('Founder');
        roleBasedTags.add('Entrepreneur');
        roleBasedTags.add('Startup');
        roleBasedTags.add('Business');
      }
      if (roleLower.includes('developer') || roleLower.includes('engineer')) {
        roleBasedTags.add('Developer');
        roleBasedTags.add('Tech');
      }
      if (roleLower.includes('designer')) {
        roleBasedTags.add('Designer');
        roleBasedTags.add('Creative');
      }
      if (roleLower.includes('marketing')) {
        roleBasedTags.add('Marketing');
        roleBasedTags.add('Business');
      }
      if (roleLower.includes('cto') || roleLower.includes('technical')) {
        roleBasedTags.add('Tech');
        roleBasedTags.add('Business');
      }
      if (roleLower.includes('remote')) {
        roleBasedTags.add('Remote');
      }
      
      const finalTags = Array.from(roleBasedTags);
      console.log('Final tags with role-based additions:', finalTags);
      
      console.log('=== PARALLEL OPERATIONS STARTING ===');
      console.log('About to start profile update with social links...');
      const startParallel = Date.now();
      
      // Prepare all parallel operations
      const parallelOps = [];
      
      // 1. Version creation (if in edit mode)
      if (editMode) {
        // Prompt user for version name
        const versionName = window.prompt('Name this version (optional):') || 'Profile updated';
        
        const versionCreation = fetch(
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
              p_version_type: 'auto',
              p_created_by: currentUser?.id || null
            })
          }
        ).then(async res => {
          const result = await res.json();
          console.log('Version creation completed:', res.status);
          return result;
        }).catch(err => {
          console.warn('Version creation failed:', err);
          return null;
        });
        
        parallelOps.push(versionCreation);
      }
      
      // 2. Profile update (main operation)
      console.log('=== PROFILE UPDATE DATA ===');
      console.log('customLinks being saved:', JSON.stringify(formData.customLinks, null, 2));
      console.log('messengerPlatforms being saved:', JSON.stringify(formData.messengerPlatforms, null, 2));
      console.log('socialLinks being saved:', JSON.stringify(formData.socialLinks, null, 2));
      console.log('Full formData:', JSON.stringify(formData, null, 2));
      
      // Use anonymous key for profile completion (revert to working version)
      console.log('Using anonymous key for profile update (reverted to working version)');
      
      // Ensure user_id is properly set
      const userIdToSet = currentUser?.id || profile?.user_id || null;
      console.log('=== USER ID ASSIGNMENT DEBUG ===');
      console.log('currentUser?.id:', currentUser?.id);
      console.log('profile?.user_id:', profile?.user_id);
      console.log('Final user_id to set:', userIdToSet);
      console.log('Profile email:', profile?.email);
      console.log('Current user email:', currentUser?.email);
      
      const profileUpdate = fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${profileId}`, {
        method: 'PATCH',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          story: formData.story,
          social_links: formData.socialLinks,
          custom_links: formData.customLinks,
          messenger_platforms: formData.messengerPlatforms,
          tags: finalTags,
          photos: formData.selectedPhotos,
          cover_photo: formData.selectedPhotos[0] || profile.coverPhoto,
          main_photo: formData.mainPhoto,
          has_completed_profile: true, // Always mark as completed when saving
          is_public: formData.isPublic === true, // User's choice for visibility
          published_profile: formData.isPublic === true, // User's choice for publishing
          photo_consent: formData.photoConsent,
          promotional_consent: formData.promotionalConsent,
          user_id: userIdToSet
        })
      }).then(async res => {
        if (res.ok) {
          console.log('Profile update completed successfully');
          
          // Verify the update by fetching the profile again
          console.log('Verifying profile update...');
          const verifyResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${profileId}&select=*`, {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Accept': 'application/json',
            }
          });
          
          if (verifyResponse.ok) {
            const verifiedData = await verifyResponse.json();
            console.log('Verified profile data from server:', JSON.stringify(verifiedData[0], null, 2));
            console.log('Social links saved:', JSON.stringify(verifiedData[0]?.social_links, null, 2));
            console.log('Custom links saved:', JSON.stringify(verifiedData[0]?.custom_links, null, 2));
            console.log('Messenger platforms saved:', JSON.stringify(verifiedData[0]?.messenger_platforms, null, 2));
            return { success: true, data: verifiedData[0] };
          } else {
            console.warn('Could not verify profile update, but update was successful');
            return { success: true, data: null };
          }
        } else {
          const errorText = await res.text();
          console.error('Profile update failed:', res.status);
          console.error('Error details:', errorText);
          console.error('Request headers:', {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          });
          console.error('Request body:', JSON.stringify({
            has_completed_profile: true,
            is_public: formData.isPublic === true,
            published_profile: formData.isPublic === true,
            user_id: currentUser?.id || profile?.user_id || null
          }, null, 2));
          console.error('Current user:', currentUser);
          console.error('Current session:', currentSession);
          console.error('Profile user_id:', profile?.user_id);
          return { success: false, error: new Error(`HTTP ${res.status}: ${errorText}`) };
        }
      });
      
      parallelOps.push(profileUpdate);
      
      // Execute all operations in parallel
      const results = await Promise.all(parallelOps);
      console.log(`Parallel operations completed in ${Date.now() - startParallel}ms`);
      
      // Check profile update result (it's always the last operation)
      const updateResult = results[results.length - 1];
      if (!updateResult.success) {
        console.error('Error updating profile:', updateResult.error);
        alert('Error saving profile. Please try again.');
        return;
      }
      
      console.log('Profile updated successfully');
      const updatedProfile = updateResult.data;
      
      // Emit profile update event
      if (formData.isPublic !== profile?.isPublic) {
        console.log('Profile visibility changed, emitting event...');
        profileEvents.emitProfileVisibilityChange();
      } else {
        console.log('Profile updated, emitting event...');
        profileEvents.emitProfileUpdate();
      }

      // Send emails in background (non-blocking)
      console.log('=== QUEUING EMAIL NOTIFICATIONS ===');
      if (!editMode) {
        // Fire and forget - don't wait for emails
        const sendEmailsAsync = async () => {
          try {
            const eventData = await supabase.from('events').select('name').eq('id', profile.eventId).single();
            const eventName = eventData?.data?.name || 'Event';
            const profileUrl = `${window.location.origin}?profile=${profileId}`;
            
            // Check if user is actually signed in before sending magic link
            const { data: { session: finalSession } } = await supabase.auth.getSession();
            
            if (accountCreated && !finalSession) {
              console.log('No active session, sending welcome email with magic link...');
              console.log('Account created:', accountCreated);
              await supabase.auth.signInWithOtp({
                email: profile.email,
                options: {
                  emailRedirectTo: window.location.hostname === 'localhost' 
                    ? `${window.location.origin}/auth/callback`
                    : 'https://www.numina.cam/auth/callback',
                  data: {
                    welcome: true,
                    profileId: profileId,
                    name: formData.name,
                  }
                }
              });
              console.log('Welcome magic link sent successfully');
            } else if (finalSession) {
              console.log('User is already signed in, skipping magic link email');
            } else {
              console.log('Sending completion email...');
              await sendProfileCompletionEmail(profile.email, formData.name, profileUrl);
              console.log('Completion email sent successfully');
            }
          } catch (emailError) {
            console.error('Error sending emails:', emailError);
            // Don't block on email errors
          }
        };
        
        // Start email sending but don't wait
        sendEmailsAsync();
        console.log('Email notifications queued for background processing');
      } else {
        console.log('Skipping email notifications in edit mode');
      }
      
      // Log total save time
      const totalSaveTime = Date.now() - saveStartTime;
      console.log(`=== SAVE COMPLETED IN ${totalSaveTime}ms ===`);
      
      // Refresh auth context to pick up the newly linked profile
      if (accountCreated || !editMode) {
        console.log('Refreshing auth context to pick up linked profile...');
        console.log('Account was created:', accountCreated);
        console.log('Current session before refresh:', currentSession);
        
        try {
          await refreshProfile();
          console.log('Auth context refreshed successfully');
          
          // Double-check if we have a session after refresh
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Session after refresh:', session);
          
          if (session) {
            console.log('✅ User is now logged in with session:', session.user?.email);
          } else {
            console.log('⚠️ No session after refresh, user will need to use magic link');
          }
        } catch (authRefreshError) {
          console.warn('Auth refresh failed, but continuing:', authRefreshError);
        }
      }
      
      // Show appropriate completion message
      if (!editMode) {
        if (accountCreated && currentSession) {
          alert('Profile completed successfully! Your story is now live and you are logged in.');
        } else if (accountCreated) {
          alert('Profile completed successfully! Check your email for a magic link to sign in and connect with others.');
        } else {
          alert('Profile completed successfully! Your story is now live.');
        }
      } else {
        alert('Profile updated successfully! Your changes have been saved.');
      }
      
      // Trigger profile events for other components to refresh
      console.log('Emitting profile update events...');
      profileEvents.emitProfileUpdate();
      profileEvents.emitProfileVisibilityChange();
      
      // Add delay to ensure database consistency and event processing
      console.log('Waiting for database consistency before navigation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Profile completion successful, calling onComplete callback');
      onComplete();
      
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error details:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
};

  const nextStep = () => {
    // Validation for minimum 2 questions in certain steps
    if (currentStep === 'step2') {
      // Check Joy & Humanity - need at least 2 questions answered
      const joyQuestions = questionsByCategory['Joy & Humanity'] || [];
      const answeredJoyQuestions = joyQuestions.filter(q => formData.answers[q.id]?.trim());
      
      console.log('=== VALIDATION DEBUG ===');
      console.log('Current step:', currentStep);
      console.log('Joy questions:', joyQuestions);
      console.log('Form answers:', formData.answers);
      console.log('Answered Joy questions:', answeredJoyQuestions);
      console.log('Count:', answeredJoyQuestions.length);
      
      if (answeredJoyQuestions.length < 2) {
        alert('Please answer at least 2 questions in the Joy & Humanity section.');
        return;
      }
    } else if (currentStep === 'step3') {
      // Check Passion & Dreams - need at least 2 questions answered
      const passionQuestions = questionsByCategory['Passion & Dreams'] || [];
      const answeredPassionQuestions = passionQuestions.filter(q => formData.answers[q.id]?.trim());
      if (answeredPassionQuestions.length < 2) {
        alert('Please answer at least 2 questions in the Passion & Dreams section.');
        return;
      }
    } else if (currentStep === 'step4') {
      // Check Story & Values - need at least 2 questions answered
      const storyQuestions = questionsByCategory['Story & Values'] || [];
      const answeredStoryQuestions = storyQuestions.filter(q => formData.answers[q.id]?.trim());
      if (answeredStoryQuestions.length < 2) {
        alert('Please answer at least 2 questions in the Story & Values section.');
        return;
      }
    }

    const allSteps = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9', 'step10'];
    const steps = allSteps; // Always include all steps including photo selection
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1] as any);
    }
  };

  const prevStep = () => {
    const allSteps = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9', 'step10'];
    const steps = allSteps; // Always include all steps including photo selection
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1] as any);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authenticating ? 'Setting up your access...' : 'Loading your profile...'}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">The profile you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Group questions by category
  const questionsByCategory = questions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Camera className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {editMode ? 'Edit Your Profile' : 'Complete Your Profile'}
              </h1>
              {editMode && (
                <button
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="ml-4 flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="View version history"
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                </button>
              )}
            </div>
            <p className="text-gray-600">
              {editMode 
                ? 'Update your profile information, story, and photo selections.'
                : 'Your professional photos are ready! Add your story to share with the community.'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9', 'step10'].indexOf(currentStep) + 1} of 10
            </span>
            <span className="text-sm text-gray-500">
              {currentStep === 'step1' && 'Name, Location & Connection'}
              {currentStep === 'step2' && 'Joy & Humanity'}
              {currentStep === 'step3' && 'Passion & Dreams'}
              {currentStep === 'step4' && 'Story & Values'}
              {currentStep === 'step5' && 'Final Thoughts'}
              {currentStep === 'step6' && 'Story Weave Beta'}
              {currentStep === 'step7' && 'Optional Fun'}
              {currentStep === 'step8' && 'Photo Selection'}
              {currentStep === 'step9' && (connectTabEnabled ? 'Profile Links & Tags' : 'Interest Tags')}
              {currentStep === 'step10' && 'Review & Publish'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9', 'step10'].indexOf(currentStep) + 1) / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Version History */}
        {showVersionHistory && editMode && profile && (
          <div className="mb-8">
            <ProfileVersionHistory
              profileId={profileId}
              currentProfile={profile}
              onRestore={handleVersionRestore}
            />
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Step 1: Name, Location & Connection Questions */}
          {currentStep === 'step1' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <img
                  src={profile.coverPhoto || profile.photos[0] || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-900">🎉 Your portraits are ready to download!</h2>
                <p className="text-gray-600">But first, let's craft the compelling story of who you are :)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Role *
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Founder, Designer, Developer, etc."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can modify the role assigned by the admin if needed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={profile?.location || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="Your location"
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">
                  Location is set from your event registration
                </p>
              </div>

              {/* Connection Questions */}
              {questionsByCategory['Connection'] && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Preferences</h3>
                  <div className="space-y-4">
                    {questionsByCategory['Connection'].map((question) => {
                      const hasAnswer = formData.answers[question.id]?.trim();
                      
                      return (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-900 block mb-2">
                            {question.questionText}
                            {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <textarea
                            value={formData.answers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            placeholder="Share your thoughts..."
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Joy & Humanity Questions */}
          {currentStep === 'step2' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <img
                  src={profile.coverPhoto || profile.photos[0] || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-900">Joy & Humanity</h2>
                <p className="text-gray-600">Answer at least 2 questions that help us understand what brings you joy</p>
              </div>

              {/* Joy & Humanity Questions */}
              {questionsByCategory['Joy & Humanity'] && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Joy & Humanity Questions</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Answer at least 2 questions that resonate with you:
                  </p>
                  
                  <div className="space-y-4">
                    {questionsByCategory['Joy & Humanity'].map((question) => {
                      const isSelected = formData.selectedQuestions['Joy & Humanity']?.includes(question.id);
                      const hasAnswer = formData.answers[question.id]?.trim();
                      
                      return (
                        <div key={question.id} className={`border rounded-lg p-4 ${isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <label className="text-sm font-medium text-gray-900 flex-1">
                              {question.questionText}
                              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <button
                              onClick={() => toggleQuestionSelection('Joy & Humanity', question.id)}
                              className={`ml-4 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                isSelected 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                          
                          {(isSelected || hasAnswer) && (
                            <textarea
                              value={formData.answers[question.id] || ''}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                              placeholder="Share your thoughts..."
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Passion & Dreams Questions */}
          {currentStep === 'step3' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <img
                  src={profile.coverPhoto || profile.photos[0] || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-900">Passion & Dreams</h2>
                <p className="text-gray-600">Answer at least 2 questions that showcase your passions and aspirations</p>
              </div>

              {/* Passion & Dreams Questions */}
              {questionsByCategory['Passion & Dreams'] && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Passion & Dreams Questions</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Answer at least 2 questions that resonate with you:
                  </p>
                  
                  <div className="space-y-4">
                    {questionsByCategory['Passion & Dreams'].map((question) => {
                      const isSelected = formData.selectedQuestions['Passion & Dreams']?.includes(question.id);
                      const hasAnswer = formData.answers[question.id]?.trim();
                      
                      return (
                        <div key={question.id} className={`border rounded-lg p-4 ${isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <label className="text-sm font-medium text-gray-900 flex-1">
                              {question.questionText}
                              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <button
                              onClick={() => toggleQuestionSelection('Passion & Dreams', question.id)}
                              className={`ml-4 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                isSelected 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                          
                          {(isSelected || hasAnswer) && (
                            <textarea
                              value={formData.answers[question.id] || ''}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                              placeholder="Share your thoughts..."
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Story & Values + AI Story Generation */}
          {currentStep === 'step4' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <img
                  src={profile.coverPhoto || profile.photos[0] || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-900">Story & Values</h2>
                <p className="text-gray-600">Share your values and let AI create your story</p>
              </div>

              {/* Story & Values Questions */}
              {questionsByCategory['Story & Values'] && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Story & Values Questions</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Answer at least 2 questions that resonate with you:
                  </p>
                  
                  <div className="space-y-4">
                    {questionsByCategory['Story & Values'].map((question) => {
                      const isSelected = formData.selectedQuestions['Story & Values']?.includes(question.id);
                      const hasAnswer = formData.answers[question.id]?.trim();
                      
                      return (
                        <div key={question.id} className={`border rounded-lg p-4 ${isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <label className="text-sm font-medium text-gray-900 flex-1">
                              {question.questionText}
                              {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <button
                              onClick={() => toggleQuestionSelection('Story & Values', question.id)}
                              className={`ml-4 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                isSelected 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                          
                          {(isSelected || hasAnswer) && (
                            <textarea
                              value={formData.answers[question.id] || ''}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                              placeholder="Share your thoughts..."
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Step 5: Final Thoughts - Open-ended Question */}
          {currentStep === 'step5' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <img
                  src={profile.coverPhoto || profile.photos[0] || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-900">Final Thoughts</h2>
                <p className="text-gray-600">Share anything else you'd like us to know</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Story, Your Way</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This is your space to share anything else about yourself that the questions might have missed. 
                  What would you like others to know about you? What makes you unique? 
                  Feel free to be as creative or authentic as you'd like.
                </p>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Is there anything else you'd like to share about yourself?
                  </label>
                  <textarea
                    value={formData.openEndedAnswer}
                    onChange={(e) => setFormData(prev => ({ ...prev, openEndedAnswer: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    placeholder="Share your thoughts, dreams, experiences, or anything else you'd like others to know..."
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    This response will help us create a more authentic and personal story for your profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Story Weave Beta */}
          {currentStep === 'step6' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <img
                  src={profile.coverPhoto || profile.photos[0] || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-900">Story Weave Beta</h2>
                <p className="text-gray-600">Let AI weave your personal story from your answers</p>
              </div>

              {/* Story Weave Beta */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-medium text-blue-900 mb-3">✨ Story Weave Beta</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Based on all your answers from the previous steps, let AI create a beautiful, personalized story for you in the style of "Humans of New York."
                </p>
                
                <button
                  onClick={handleGenerateStory}
                  disabled={generatingStory || Object.keys(formData.answers).length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingStory ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating your story...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Weave My Story</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Story {formData.story && '(AI Generated - Feel free to edit!)'}
                </label>
                <textarea
                  value={formData.story}
                  onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Share your professional journey, what you're passionate about, and what makes you unique... Or use the AI generator above!"
                />
                <p className="text-sm text-gray-500 mt-2">
                  This will be displayed on your public profile. You can write it yourself or use the AI generator above to create a beautiful narrative from your answers.
                </p>
              </div>
            </div>
          )}

          {/* Step 7: Optional Fun Questions */}
          {currentStep === 'step7' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <img
                  src={profile.coverPhoto || profile.photos[0] || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-900">Optional Fun</h2>
                <p className="text-gray-600">Add some personality with these fun questions</p>
              </div>

              {/* Optional Fun Questions */}
              {questionsByCategory['Optional Fun'] && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Optional Fun Questions</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    These fun questions will be displayed on your public profile to help others get to know your personality better.
                  </p>
                  
                  <div className="space-y-4">
                    {questionsByCategory['Optional Fun'].map((question) => {
                      const hasAnswer = formData.answers[question.id]?.trim();
                      
                      return (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-900 block mb-2">
                            {question.questionText}
                            {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <textarea
                            value={formData.answers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            placeholder="Share your thoughts..."
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 8: Photo Selection */}
          {currentStep === 'step8' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Your Photos</h2>
                <p className="text-gray-600">Choose which photos to display publicly and give your consent</p>
              </div>

              {/* Photo Consent */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo Consent</h3>
                <div className="space-y-4">
                  {/* First consent checkbox */}
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.photoConsent}
                      onChange={(e) => setFormData(prev => ({ ...prev, photoConsent: e.target.checked }))}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        I consent to having my professional photos used for this community directory.
                      </span>
                    </div>
                  </label>
                  
                  {/* Second consent checkbox for promotional use */}
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.promotionalConsent}
                      onChange={(e) => setFormData(prev => ({ ...prev, promotionalConsent: e.target.checked }))}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        I consent to the use of my portrait in the community directory and for related promotion, including sharing via social media, for the purpose of highlighting the directory and its members.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {profile.photos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No photos available for this profile.</p>
                </div>
              ) : (
                <>
                  {/* Main Photo Selection */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      📸 Main Photo for Directory
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Choose your main photo that will be prominently displayed in the community directory. This will be the first photo people see when browsing profiles.
                    </p>
                    
                    {formData.mainPhoto && (
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={formData.mainPhoto}
                          alt="Selected main photo"
                          className="w-20 h-20 rounded-lg object-cover border-2 border-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Current Main Photo</p>
                          <p className="text-sm text-gray-500">This photo will appear in the directory</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.photos.map((photo, index) => {
                      const isSelected = formData.selectedPhotos.includes(photo);
                      const isMainPhoto = formData.mainPhoto === photo;
                      
                      return (
                        <div
                          key={index}
                          className={`relative rounded-lg overflow-hidden border-4 transition-all ${
                            isMainPhoto
                              ? 'border-blue-500 shadow-lg'
                              : isSelected
                              ? 'border-purple-600 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full aspect-[4/5] object-cover"
                          />
                          
                          {/* Main Photo Badge */}
                          {isMainPhoto && (
                            <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                              Main Photo
                            </div>
                          )}
                          
                          {/* Selected Badge */}
                          {isSelected && !isMainPhoto && (
                            <div className="absolute top-3 right-3 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center">
                              ✓
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, mainPhoto: photo }))}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                  isMainPhoto
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/90 text-gray-900 hover:bg-white'
                                }`}
                              >
                                {isMainPhoto ? 'Main Photo' : 'Set as Main'}
                              </button>
                              <button
                                onClick={() => togglePhotoSelection(photo)}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/90 text-gray-900 hover:bg-white'
                                }`}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">Main Photo:</span>
                        <span className="ml-2 text-gray-600">
                          {formData.mainPhoto ? '✓ Selected' : '⚠️ Not selected'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Public Photos:</span>
                        <span className="ml-2 text-gray-600">
                          {formData.selectedPhotos.length} of {profile.photos.length} selected
                        </span>
                      </div>
                    </div>
                    
                    {!formData.mainPhoto && (
                      <p className="text-amber-600 text-sm mt-2">
                        ⚠️ Please select a main photo for directory display
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 9: Profile Links & Tags */}
          {currentStep === 'step9' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <img
                  src={profile.coverPhoto || profile.photos[0] || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-900">{connectTabEnabled ? 'Profile Links' : 'Interest Tags'}</h2>
                <p className="text-gray-600">{connectTabEnabled ? 'Connect your social media, custom links, and messaging platforms' : 'Add topics to help others connect with you'}</p>
              </div>

              {/* Social Media Links - Only show if Connect tab is enabled */}
              {connectTabEnabled && (
                <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Social Media</h3>
                <p className="text-sm text-gray-600 mb-4">Enter your username only - we'll create the complete link automatically</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn Username
                    </label>
                    <input
                      type="text"
                      value={extractUsernameFromUrl('linkedin', formData.socialLinks.linkedin)}
                      onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="yourname"
                    />
                    {formData.socialLinks.linkedin && (
                      <p className="text-xs text-gray-500 mt-1">→ {formData.socialLinks.linkedin}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram Username
                    </label>
                    <input
                      type="text"
                      value={extractUsernameFromUrl('instagram', formData.socialLinks.instagram)}
                      onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="yourname"
                    />
                    {formData.socialLinks.instagram && (
                      <p className="text-xs text-gray-500 mt-1">→ {formData.socialLinks.instagram}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter/X Username
                    </label>
                    <input
                      type="text"
                      value={extractUsernameFromUrl('twitter', formData.socialLinks.twitter)}
                      onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="yourname"
                    />
                    {formData.socialLinks.twitter && (
                      <p className="text-xs text-gray-500 mt-1">→ {formData.socialLinks.twitter}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube Username
                    </label>
                    <input
                      type="text"
                      value={extractUsernameFromUrl('youtube', formData.socialLinks.youtube || '')}
                      onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="yourname"
                    />
                    {formData.socialLinks.youtube && (
                      <p className="text-xs text-gray-500 mt-1">→ {formData.socialLinks.youtube}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook Username
                    </label>
                    <input
                      type="text"
                      value={extractUsernameFromUrl('facebook', formData.socialLinks.facebook || '')}
                      onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="yourname"
                    />
                    {formData.socialLinks.facebook && (
                      <p className="text-xs text-gray-500 mt-1">→ {formData.socialLinks.facebook}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personal Website URL
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Enter the complete website URL</p>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="url"
                        value={formData.socialLinks.website}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, website: e.target.value }
                        }))}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Custom Links - Only show if Connect tab is enabled */}
              {connectTabEnabled && (
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Links</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add up to 5 custom links like portfolios, specific videos, Linktree, etc.
                </p>
                <div className="space-y-4">
                  {formData.customLinks.map((link, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Link Name
                        </label>
                        <input
                          type="text"
                          value={link.name}
                          onChange={(e) => {
                            const newCustomLinks = [...formData.customLinks];
                            newCustomLinks[index].name = e.target.value;
                            setFormData(prev => ({ ...prev, customLinks: newCustomLinks }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g. My Portfolio, Linktree, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL
                        </label>
                        <div className="relative">
                          <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => {
                              const newCustomLinks = [...formData.customLinks];
                              newCustomLinks[index].url = e.target.value;
                              setFormData(prev => ({ ...prev, customLinks: newCustomLinks }));
                            }}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Messenger Platforms - Only show if Connect tab is enabled */}
              {connectTabEnabled && (
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Messaging Platforms</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add your messaging platform handles so people can connect with you directly.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formData.messengerPlatforms.whatsapp}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        messengerPlatforms: { ...prev.messengerPlatforms, whatsapp: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+1234567890 or https://wa.me/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telegram
                    </label>
                    <input
                      type="text"
                      value={formData.messengerPlatforms.telegram}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        messengerPlatforms: { ...prev.messengerPlatforms, telegram: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="@username or https://t.me/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WeChat
                    </label>
                    <input
                      type="text"
                      value={formData.messengerPlatforms.wechat}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        messengerPlatforms: { ...prev.messengerPlatforms, wechat: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="WeChat ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Line
                    </label>
                    <input
                      type="text"
                      value={formData.messengerPlatforms.line}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        messengerPlatforms: { ...prev.messengerPlatforms, line: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Line ID or https://line.me/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signal
                    </label>
                    <input
                      type="text"
                      value={formData.messengerPlatforms.signal}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        messengerPlatforms: { ...prev.messengerPlatforms, signal: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Interest Tags - Always show */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interest Tags</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add topics or hobbies you're interested in to help others connect with you
                </p>

                {/* Selected Tags */}
                {formData.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Your Selected Tags</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-purple-500 hover:text-purple-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Role-based Tags */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Role Tags</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['Founder', 'Entrepreneur', 'Developer', 'Designer', 'Creative', 'Tech', 'Marketing', 'Business', 'Startup', 'Remote'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTagSelection(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.tags.includes(tag)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Tags */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Interest Tags</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTagSelection(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.tags.includes(tag)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add Custom Tag */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add Custom Tag</h4>
                  <div className="flex">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Add a custom tag..."
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 text-center">
                All links and messaging platforms are optional. Add only the ones you want to share publicly.
              </p>
            </div>
          )}

          {/* Step 10: Review & Publish */}
          {currentStep === 'step10' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Your Profile</h2>
                <p className="text-gray-600">Make sure everything looks good before publishing</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4 mb-6">
                  <img
                    src={formData.mainPhoto || formData.selectedPhotos[0] || profile.coverPhoto || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                    alt={formData.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{formData.name}</h3>
                    <p className="text-purple-600">{formData.role}</p>
                    <p className="text-sm text-gray-500">{profile.location}</p>
                    {formData.mainPhoto && (
                      <p className="text-xs text-blue-600 mt-1">📸 Main directory photo selected</p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Story</h4>
                  {formData.story ? (
                    <div 
                      className="text-gray-700 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: (() => {
                          let formatted = formData.story;
                          // Replace bold markers
                          formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                          // Replace italic markers (but not the ones that were part of bold)
                          formatted = formatted.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
                          // Replace line breaks
                          formatted = formatted.replace(/\n/g, '<br />');
                          console.log('Original story:', formData.story);
                          console.log('Formatted story:', formatted);
                          return formatted;
                        })()
                      }}
                    />
                  ) : (
                    <p className="text-gray-700 text-sm leading-relaxed">No story added yet.</p>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-1">Your Answers</h4>
                  <p className="text-sm text-gray-500 mb-2">(This is not shown on your profile)</p>
                  <div className="space-y-3">
                    {Object.entries(formData.answers).map(([questionId, answer]) => {
                      const question = questions.find(q => q.id === questionId);
                      if (!question || !answer.trim()) return null;
                      
                      return (
                        <div key={questionId} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-900 mb-1">{question.questionText}</p>
                          <p className="text-sm text-gray-700">{answer}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Selected Photos ({formData.selectedPhotos.length})</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {formData.selectedPhotos.slice(0, 4).map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Selected ${index + 1}`}
                        className="w-full aspect-[4/5] object-cover rounded"
                      />
                    ))}
                    {formData.selectedPhotos.length > 4 && (
                      <div className="w-full aspect-[4/5] bg-gray-200 rounded flex items-center justify-center text-gray-600 text-xs">
                        +{formData.selectedPhotos.length - 4} more
                      </div>
                    )}
                  </div>
                </div>

                {formData.tags.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Interest Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Object.values(formData.socialLinks).some(link => link) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Social Links</h4>
                    <div className="space-y-1 text-sm">
                      {formData.socialLinks.linkedin && (
                        <p className="text-gray-600">LinkedIn: {formData.socialLinks.linkedin}</p>
                      )}
                      {formData.socialLinks.instagram && (
                        <p className="text-gray-600">Instagram: {formData.socialLinks.instagram}</p>
                      )}
                      {formData.socialLinks.twitter && (
                        <p className="text-gray-600">Twitter: {formData.socialLinks.twitter}</p>
                      )}
                      {formData.socialLinks.website && (
                        <p className="text-gray-600">Website: {formData.socialLinks.website}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy Settings */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Privacy Settings</h4>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          isPublic: isChecked,
                          // Also update photo consent if making profile public and consent wasn't given
                          photoConsent: isChecked && !prev.photoConsent ? true : prev.photoConsent
                        }));
                      }}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor="isPublic" className="text-sm font-medium text-gray-900">
                        Make my profile public
                      </label>
                      {!formData.photoConsent && !formData.isPublic ? (
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm text-gray-700 mb-2">
                            Your profile is currently private based on your photo sharing preference.
                          </p>
                          <p className="text-sm text-purple-700 font-medium">
                            Don't miss out on being part of this amazing community! By making your profile public, we'll also update your photo consent to include directory use - this helps showcase the real people behind the profiles and makes meaningful connections more likely.
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          When enabled, your profile will be visible to everyone in the directory. 
                          When disabled, your profile will be private and only visible to you.
                        </p>
                      )}
                      
                      {/* Confirmation message when both settings are updated */}
                      {formData.isPublic && formData.photoConsent && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700">
                            ✓ Great choice! Your profile is now public and photo consent has been updated.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">Photo Sharing</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      You have selected <strong>{formData.selectedPhotos.length}</strong> out of <strong>{profile.photos.length}</strong> photos 
                      to be displayed publicly on your profile. Only these selected photos will be visible to others.
                    </p>
                    {formData.selectedPhotos.length === 0 && (
                      <p className="text-sm text-amber-600 mt-2">
                        ⚠️ No photos selected for public display. Consider selecting at least one photo.
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">Photo Consent</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Directory use: <strong>{formData.photoConsent ? 'Given' : 'Not provided'}</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      Promotional use: <strong>{formData.promotionalConsent ? 'Given' : 'Not provided'}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 'step1'}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentStep === 'step1'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>
            
            {currentStep === 'step10' ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all transform ${
                  saving 
                    ? 'bg-purple-800 text-white scale-95 cursor-not-allowed' 
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 active:scale-95'
                } disabled:opacity-75`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>{editMode ? 'Saving...' : 'Publishing...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editMode ? 'Save Changes' : 'Publish Profile'}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};