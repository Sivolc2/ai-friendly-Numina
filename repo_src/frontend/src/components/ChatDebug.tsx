import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DebugResult {
  check_name: string;
  result: boolean;
  details: string;
}

export const ChatDebug: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [conversationDebug, setConversationDebug] = useState<any[]>([]);
  const [otherUserEmail, setOtherUserEmail] = useState('');
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runPermissionDebug = async () => {
    if (!userProfile) {
      console.error('No user profile found');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('debug_chat_permissions', {
        p_profile_id: userProfile.id
      });

      if (error) throw error;
      setDebugResults(data);
    } catch (error) {
      console.error('Debug failed:', error);
      setDebugResults([{
        check_name: 'Debug Error',
        result: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const checkConversations = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_conversations_with_participants', {
        profile_id: userProfile.id
      });

      if (error) throw error;
      setConversationDebug(data);
      console.log('Conversation debug results:', data);
    } catch (error) {
      console.error('Conversation debug failed:', error);
      setConversationDebug([]);
    } finally {
      setLoading(false);
    }
  };

  const findOtherUser = async () => {
    if (!otherUserEmail) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', otherUserEmail.trim().toLowerCase())
        .single();

      if (error) throw error;
      setOtherProfile(data);
      console.log('Found other user:', data);
    } catch (error) {
      console.error('User search failed:', error);
      setOtherProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const findConversationBetweenUsers = async () => {
    if (!userProfile || !otherProfile) return;

    setLoading(true);
    try {
      // Direct database query to find conversation
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [userProfile.id])
        .contains('participant_ids', [otherProfile.id]);

      if (error) throw error;
      
      console.log(`Conversation search between ${userProfile.email} and ${otherProfile.email}:`, data);
      
      if (data.length > 0) {
        // Check messages in this conversation
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', data[0].id)
          .order('created_at', { ascending: false });

        if (msgError) throw msgError;
        console.log('Messages in conversation:', messages);
      }
      
      setConversationDebug(data);
    } catch (error) {
      console.error('Conversation search failed:', error);
      setConversationDebug([]);
    } finally {
      setLoading(false);
    }
  };

  const createTestConversation = async () => {
    if (!userProfile || !otherProfile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        profile_id_1: userProfile.id,
        profile_id_2: otherProfile.id
      });

      if (error) throw error;
      
      console.log('Conversation created/found:', data);
      
      // Send a test message
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: data,
          sender_id: userProfile.id,
          content: `Debug test message from ${userProfile.name} at ${new Date().toISOString()}`,
          message_type: 'text'
        })
        .select()
        .single();

      if (msgError) throw msgError;
      
      console.log('Test message sent:', message);
      alert(`Test message sent! Conversation ID: ${data}`);
    } catch (error) {
      console.error('Test conversation failed:', error);
      alert(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p>Please sign in to use chat debug tools</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">Chat System Debug</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Current User</h3>
          <p>Profile ID: {userProfile.id}</p>
          <p>Email: {userProfile.email}</p>
          <p>Name: {userProfile.name}</p>
        </div>

        <div>
          <button
            onClick={runPermissionDebug}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Run Permission Debug'}
          </button>
        </div>

        {debugResults.length > 0 && (
          <div>
            <h3 className="font-semibold">Permission Debug Results:</h3>
            {debugResults.map((result, index) => (
              <div key={index} className={`p-2 rounded ${result.result ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={result.result ? 'text-green-700' : 'text-red-700'}>
                  {result.result ? '✅' : '❌'} {result.check_name}: {result.details}
                </span>
              </div>
            ))}
          </div>
        )}

        <div>
          <button
            onClick={checkConversations}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Check My Conversations'}
          </button>
        </div>

        <div>
          <h3 className="font-semibold">Find Other User</h3>
          <input
            type="email"
            value={otherUserEmail}
            onChange={(e) => setOtherUserEmail(e.target.value)}
            placeholder="Enter other user's email"
            className="border rounded px-3 py-2 mr-2"
          />
          <button
            onClick={findOtherUser}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Find User
          </button>
        </div>

        {otherProfile && (
          <div className="p-3 bg-gray-50 rounded">
            <h3 className="font-semibold">Other User Found:</h3>
            <p>Profile ID: {otherProfile.id}</p>
            <p>Email: {otherProfile.email}</p>
            <p>Name: {otherProfile.name}</p>
          </div>
        )}

        {otherProfile && (
          <div className="space-x-2">
            <button
              onClick={findConversationBetweenUsers}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              Find Conversation Between Users
            </button>
            <button
              onClick={createTestConversation}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Create Test Conversation
            </button>
          </div>
        )}

        {conversationDebug.length > 0 && (
          <div>
            <h3 className="font-semibold">Conversation Results:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(conversationDebug, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};