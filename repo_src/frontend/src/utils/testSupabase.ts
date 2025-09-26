import { supabase } from '../lib/supabase';

export async function testSupabaseConnection() {
  console.log('=== TESTING SUPABASE CONNECTION ===');
  
  // Test 1: Check if Supabase client exists
  console.log('1. Supabase client exists:', !!supabase);
  
  // Test 2: Try a simple auth check
  try {
    console.log('2. Testing auth.getSession()...');
    const { data: session, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Auth test failed:', error);
    } else {
      console.log('Auth test successful. Session:', session?.session ? 'Active' : 'None');
    }
  } catch (err) {
    console.error('Auth test exception:', err);
  }
  
  // Test 3: Try a simple query with timeout
  try {
    console.log('3. Testing database query with 3s timeout...');
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 3s')), 3000)
    );
    
    const queryPromise = supabase
      .from('feedback_tickets')
      .select('count')
      .limit(1);
    
    const result = await Promise.race([queryPromise, timeoutPromise]);
    console.log('Database query successful:', result);
  } catch (err) {
    console.error('Database query failed:', err);
  }
  
  // Test 4: Check Supabase URL and anon key
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('4. Supabase URL configured:', !!supabaseUrl, supabaseUrl ? `(${supabaseUrl.substring(0, 30)}...)` : '');
  console.log('5. Supabase Anon Key configured:', !!supabaseKey, supabaseKey ? '(key present)' : '');
  
  // Test 5: Try a simple insert with timeout
  try {
    console.log('6. Testing insert with 3s timeout...');
    
    const testData = {
      user_id: null,
      contact_email: 'test@example.com',
      type: 'feedback',
      title: 'Connection Test',
      description: 'Testing Supabase connection',
      priority: 'low',
      status: 'open'
    };
    
    const insertTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Insert timeout after 3s')), 3000)
    );
    
    const insertPromise = supabase
      .from('feedback_tickets')
      .insert(testData);
    
    const result = await Promise.race([insertPromise, insertTimeout]);
    
    if (result.error) {
      console.error('Insert test failed:', result.error);
    } else {
      console.log('Insert test successful!');
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('feedback_tickets')
        .delete()
        .eq('title', 'Connection Test')
        .eq('contact_email', 'test@example.com');
      
      if (!deleteError) {
        console.log('Test data cleaned up');
      }
    }
  } catch (err) {
    console.error('Insert test exception:', err);
  }
  
  console.log('=== CONNECTION TEST COMPLETE ===');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testSupabaseConnection = testSupabaseConnection;
}