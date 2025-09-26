import { createClient } from '@supabase/supabase-js'

// Environment variables for Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

console.log('Supabase config:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined'
})

// Create Supabase client with optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable URL detection which can hang
    flowType: 'implicit' // Use implicit flow instead of PKCE
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    },
    timeout: 5000 // Add timeout for realtime connection
  },
  global: {
    fetch: (...args) => {
      // Wrap fetch with timeout for better reliability
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      return fetch(args[0], {
        ...args[1],
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))
    }
  }
})

// Database type definitions (auto-generated)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          story: string
          cover_photo: string
          photos: string[]
          main_photo?: string
          social_links: Record<string, any>
          custom_links: Record<string, any>[]
          messenger_platforms: Record<string, any>
          tags: string[]
          event_id?: string
          location: string
          is_public: boolean
          has_completed_profile: boolean
          published_profile?: boolean
          video_url?: string
          photographer_tier?: string
          can_invite?: boolean
          organization_id?: string
          parent_organiser_id?: string
          invited_by?: string
          organization_name?: string
          invitation_accepted_at?: string
          user_id?: string
          created_at: string
          updated_at?: string
          story_answers?: string
          joy_humanity_answers?: string
          passion_dreams_answers?: string
          connection_preferences_answers?: string
          open_ended_answer?: string
          ai_generated_at?: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: string
          story?: string
          cover_photo?: string
          photos?: string[]
          main_photo?: string
          social_links?: Record<string, any>
          custom_links?: Record<string, any>[]
          messenger_platforms?: Record<string, any>
          tags?: string[]
          event_id?: string
          location?: string
          is_public?: boolean
          has_completed_profile?: boolean
          published_profile?: boolean
          video_url?: string
          photographer_tier?: string
          can_invite?: boolean
          organization_id?: string
          parent_organiser_id?: string
          invited_by?: string
          organization_name?: string
          invitation_accepted_at?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          story_answers?: string
          joy_humanity_answers?: string
          passion_dreams_answers?: string
          connection_preferences_answers?: string
          open_ended_answer?: string
          ai_generated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string
          story?: string
          cover_photo?: string
          photos?: string[]
          main_photo?: string
          social_links?: Record<string, any>
          custom_links?: Record<string, any>[]
          messenger_platforms?: Record<string, any>
          tags?: string[]
          event_id?: string
          location?: string
          is_public?: boolean
          has_completed_profile?: boolean
          published_profile?: boolean
          video_url?: string
          photographer_tier?: string
          can_invite?: boolean
          organization_id?: string
          parent_organiser_id?: string
          invited_by?: string
          organization_name?: string
          invitation_accepted_at?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          story_answers?: string
          joy_humanity_answers?: string
          passion_dreams_answers?: string
          connection_preferences_answers?: string
          open_ended_answer?: string
          ai_generated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          category: string
          question_text: string
          display_order: number
          is_required: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      answers: {
        Row: {
          id: string
          profile_id: string
          question_id: string
          answer_text: string
          created_at: string
          updated_at: string
        }
      }
      tags: {
        Row: {
          id: string
          tag_name: string
          usage_count: number
          created_at: string
          updated_at: string
        }
      }
      communities: {
        Row: {
          id: string
          name: string
          location: string
          date: string
          description: string
          cover_image: string
          is_private: boolean
          participant_count: number
          tags: string[]
          user_id?: string
          organization_id?: string
          community_series?: string
          sequence_number?: number
          created_at: string
          updated_at: string
        }
      }
      form_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          description?: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
}