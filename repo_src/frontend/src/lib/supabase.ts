import { createClient } from '@supabase/supabase-js';

// Fallback to hardcoded values for production deployment
const supabaseUrl = 'https://lofbtjwpmlkcaxolrxtn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZmJ0andwbWxrY2F4b2xyeHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM2NTQsImV4cCI6MjA2OTM0OTY1NH0.sBpqN7iq1Qp5EahHtD5Z2YS4IuJ9IwyAVFNFdvjdee8';

console.log('Supabase config:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) : 'undefined'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with specific config to prevent hanging
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable URL detection which can hang
    flowType: 'implicit' // Use implicit flow instead of PKCE which might hang
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    },
    timeout: 1000 // Add timeout for realtime connection
  },
  global: {
    fetch: (...args) => {
      // Wrap fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      return fetch(args[0], {
        ...args[1],
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
    }
  }
});