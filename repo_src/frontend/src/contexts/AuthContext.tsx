import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isPhotographer: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithMagicLink: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkUserRole: (email: string) => Promise<{ 
    isRegistered: boolean; 
    isAdmin: boolean; 
    isPhotographer: boolean; 
    prefersMagicLink: boolean;
    suggestFeedbackForm: boolean;
    errorType?: 'server_error' | 'not_found' | null;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, retryCount: number = 0): Promise<UserProfile | null> => {
    console.log('DEBUG: Fetching profile for user:', userId, 'Retry:', retryCount);
    
    try {
      // Simple profile fetch with retry mechanism
      // First try with user_id
      const { data, error } = await supabase
        .from('profiles')
        .select('id,name,email,role')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('DEBUG: Profile query result:', { 
        data, 
        error, 
        userId,
        errorMessage: error?.message,
        errorCode: error?.code,
        dataIsNull: data === null,
        dataIsUndefined: data === undefined
      });
      
      if (!error && data) {
        console.log('DEBUG: Successfully fetched profile:', data);
        const profile: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role
        };
        console.log('DEBUG: Constructed profile object:', profile);
        console.log('DEBUG: Returning profile:', profile);
        return profile;
      }
      
      // If error and we haven't exceeded retries, try again
      if (error && retryCount < 3) {
        console.warn(`DEBUG: Profile query failed (attempt ${retryCount + 1}/3):`, error);
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return fetchUserProfile(userId, retryCount + 1);
      }
      
      // If no profile found, check for email-based profile or create one
      if (!data) {
        console.log('DEBUG: No profile found by user_id, checking email-based profiles...');
        return await handleMissingProfile(userId);
      }
      
      // If error persists after retries, try fallback
      if (error) {
        console.warn('DEBUG: Profile query failed after retries:', error);
        return await createAuthFallbackProfile(userId);
      }
      
      console.log('DEBUG: Returning profile:', null);
      return null;
      
    } catch (error) {
      console.error('DEBUG: Unexpected error in fetchUserProfile:', error);
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return fetchUserProfile(userId, retryCount + 1);
      }
      return await createAuthFallbackProfile(userId);
    }
  };

  const createAuthFallbackProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId) {
        const fallbackProfile: UserProfile = {
          id: userId,
          email: user.email || '',
          name: user.email?.split('@')[0] || 'User',
          role: 'member'
        };
        
        console.log('DEBUG: Created auth-based fallback profile:', fallbackProfile);
        return fallbackProfile;
      }
    } catch (error) {
      console.error('DEBUG: Failed to create auth fallback profile:', error);
    }
    return null;
  };

  const handleMissingProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.id !== userId) {
        return null;
      }
      
      // Check if there's a profile with this user's email (from upload flow)
      if (user.email) {
        console.log('DEBUG: Checking for profile by email:', user.email);
        
        const { data: emailProfile, error: emailError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .limit(1);
        
        if (!emailError && emailProfile && emailProfile.length > 0) {
          console.log('DEBUG: Found profile by email, linking to auth user');
          
          // Update the profile to link it with the auth user ID
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ user_id: userId })
            .eq('id', emailProfile[0].id)
            .select('id,name,email,role')
            .single();
          
          if (!updateError && updatedProfile) {
            console.log('DEBUG: Successfully linked profile to auth user');
            return updatedProfile;
          }
          
          // Return original profile even if update failed
          return {
            id: emailProfile[0].id,
            name: emailProfile[0].name,
            email: emailProfile[0].email,
            role: emailProfile[0].role
          };
        }
      }
      
      // Create a basic profile entry
      console.log('DEBUG: Creating new basic profile for user');
      const profileData = {
        id: userId,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: 'member',
        has_completed_profile: false,
        is_public: false,
        published_profile: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select('id,name,email,role')
        .single();
      
      if (!createError && newProfile) {
        console.log('DEBUG: Successfully created new profile');
        return newProfile;
      }
      
      // Handle unique constraint violations (race condition)
      if (createError?.code === '23505') {
        console.log('DEBUG: Profile already exists, fetching it');
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id,name,email,role')
          .eq('id', userId)
          .single();
        
        if (existingProfile) {
          return existingProfile;
        }
      }
      
      console.warn('DEBUG: Profile creation failed, using fallback:', createError);
      return await createAuthFallbackProfile(userId);
      
    } catch (error) {
      console.error('DEBUG: Error in handleMissingProfile:', error);
      return await createAuthFallbackProfile(userId);
    }
  };

  useEffect(() => {
    console.log('DEBUG: AuthContext initializing...');
    
    // Get initial session - simple, no retries
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('DEBUG: Initial session:', session?.user?.id, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
        console.log('DEBUG: Initial profile set:', profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    // Listen for auth changes - simple
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('DEBUG: Auth state change:', event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
        console.log('DEBUG: Profile updated after auth change:', profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('DEBUG: Attempting sign in with:', email);
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      console.log('DEBUG: Sign in result:', result);
      return { error: result.error };
    } catch (err) {
      console.error('DEBUG: Sign in exception:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    console.log('DEBUG: Attempting magic link sign in with:', email);
    try {
      // Use explicit domain for production, fallback to current origin for dev
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth/callback`
        : 'https://www.numina.cam/auth/callback';
      
      console.log('DEBUG: Using redirect URL:', redirectUrl);
      
      const result = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      
      console.log('DEBUG: Magic link result:', result);
      
      // Enhanced error handling
      if (result.error) {
        console.error('DEBUG: Magic link error details:', {
          message: result.error.message,
          status: result.error.status,
          error_code: result.error.__isAuthError ? 'AuthError' : 'Unknown',
          full_error: result.error
        });
        
        // Provide user-friendly error messages
        let friendlyMessage = result.error.message;
        if (result.error.status === 500) {
          friendlyMessage = 'Server error occurred. Please try again or contact support if the issue persists.';
        } else if (result.error.message.includes('rate limit')) {
          friendlyMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (result.error.message.includes('email')) {
          friendlyMessage = 'Invalid email address or email delivery failed. Please check your email and try again.';
        }
        
        return { error: { ...result.error, message: friendlyMessage } };
      }
      
      return { error: result.error };
    } catch (err) {
      console.error('DEBUG: Magic link exception:', err);
      const friendlyError = {
        message: 'Network error occurred. Please check your connection and try again.',
        originalError: err
      };
      return { error: friendlyError };
    }
  };

  const signOut = async () => {
    console.log('DEBUG: Signing out user');
    
    // Sign out from Supabase first
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('DEBUG: Error signing out:', error);
    } else {
      console.log('DEBUG: Successfully signed out');
    }
    
    // Clear local state after successful signout
    setUserProfile(null);
    setUser(null);
    setSession(null);
    
    // Clear any cached data
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  };

  const refreshProfile = async () => {
    console.log('DEBUG: Manual profile refresh requested');
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
      console.log('DEBUG: Profile refreshed:', profile);
    }
  };

  const checkUserRole = async (email: string) => {
    console.log('DEBUG: Checking user role and registration for:', email);
    
    try {
      // Check if this is a known admin/photographer email pattern first
      const adminEmailPatterns = [
        'derrick@derricksiu.com',
        'accounts@derricksiu.com',
        '@derricksiu.com',
      ];
      
      const isKnownAdmin = adminEmailPatterns.some(pattern => 
        pattern.startsWith('@') ? email.endsWith(pattern) : email === pattern
      );

      // Add timeout and retry logic for robustness
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const queryPromise = supabase
        .from('profiles')
        .select('role, email')
        .eq('email', email)
        .limit(1);
      
      const { data: profileData, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('DEBUG: Profile lookup result:', { 
        profileData, 
        error, 
        count: profileData?.length,
        errorCode: error?.code,
        errorStatus: error?.status 
      });

      // Handle database/server errors with fallback for known emails
      if (error) {
        console.error('DEBUG: Server error checking user role:', error);
        
        // If API is failing but this is a known admin email, provide fallback
        if (isKnownAdmin) {
          console.log('DEBUG: API failing but email is known admin, using fallback');
          return {
            isRegistered: true, // Assume registered for known admins
            isAdmin: true,
            isPhotographer: true,
            prefersMagicLink: false, // Admins prefer password
            suggestFeedbackForm: false,
            errorType: null // Don't show error for known admins
          };
        }
        
        return { 
          isRegistered: false,
          isAdmin: false, 
          isPhotographer: false, 
          prefersMagicLink: true,
          suggestFeedbackForm: false,
          errorType: 'server_error'
        };
      }

      // If user exists in profiles (registered user)
      if (profileData && profileData.length > 0) {
        const profile = profileData[0];
        const role = profile.role?.toLowerCase() || '';
        const isAdmin = role.includes('admin') || 
                       role.includes('photographer') || 
                       role.includes('founder') || 
                       role.includes('ceo') ||
                       isKnownAdmin;
        const isPhotographer = role.includes('photographer') || isAdmin;
        
        console.log('DEBUG: Registered user role analysis:', { 
          email,
          role, 
          isAdmin, 
          isPhotographer,
          prefersMagicLink: !isAdmin // Admins prefer password, regular users prefer magic link
        });
        
        return { 
          isRegistered: true,
          isAdmin, 
          isPhotographer, 
          prefersMagicLink: !isAdmin,
          suggestFeedbackForm: false,
          errorType: null
        };
      }

      // User not found in profiles (unregistered)
      console.log('DEBUG: Unregistered email:', email);
      
      // Check if they appear to be admin based on email (for invite flow)
      if (isKnownAdmin) {
        return {
          isRegistered: false,
          isAdmin: true,
          isPhotographer: true,
          prefersMagicLink: false, // Admins prefer password
          suggestFeedbackForm: false, // Don't suggest feedback for admin emails
          errorType: 'not_found'
        };
      }

      // Regular unregistered user - suggest feedback form
      return {
        isRegistered: false,
        isAdmin: false,
        isPhotographer: false,
        prefersMagicLink: true,
        suggestFeedbackForm: true,
        errorType: 'not_found'
      };

    } catch (err) {
      console.error('DEBUG: Exception in checkUserRole:', err);
      // Network/connection error
      return { 
        isRegistered: false,
        isAdmin: false, 
        isPhotographer: false, 
        prefersMagicLink: true,
        suggestFeedbackForm: false,
        errorType: 'server_error'
      };
    }
  };

  // Determine user permissions
  const isSuperAdmin =
    userProfile?.email === 'derrick@derricksiu.com' ||
    user?.email === 'derrick@derricksiu.com' ||
    userProfile?.email === 'accounts@derricksiu.com' ||
    user?.email === 'accounts@derricksiu.com' ||
    userProfile?.role?.toLowerCase().includes('super_admin') ||
    userProfile?.role?.toLowerCase().includes('founder') ||
    userProfile?.role?.toLowerCase().includes('ceo') ||
    false;


  const isPhotographer =
    userProfile?.role?.toLowerCase().includes('photographer') ||
    isSuperAdmin ||
    false;

  const isAdmin =
    isPhotographer ||
    isSuperAdmin ||
    false;

  // ✅ Memoize to avoid new object reference every render
  const value = useMemo(
    () => ({
      user,
      userProfile,
      session,
      loading,
      isAdmin,
      isPhotographer,
      isSuperAdmin,
      signIn,
      signUp,
      signInWithMagicLink,
      signOut,
      refreshProfile,
      checkUserRole,
    }),
    [user, userProfile, session, loading, isAdmin, isPhotographer, isSuperAdmin] // only recompute if these change
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};