import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FeedbackTicket, FeedbackStats } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UseFeedbackReturn {
  // User functions
  tickets: FeedbackTicket[];
  loading: boolean;
  error: string | null;
  submitFeedback: (data: {
    type: 'bug' | 'feature' | 'feedback' | 'member';
    title: string;
    description: string;
    contactEmail?: string;
    attachmentUrls?: string[];
    userAgent?: string;
    pageUrl?: string;
  }) => Promise<boolean>;
  refreshTickets: () => Promise<void>;
  
  // Admin functions
  allTickets: FeedbackTicket[];
  feedbackStats: FeedbackStats | null;
  loadingAdmin: boolean;
  fetchAllTickets: (filters?: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed', adminNotes?: string) => Promise<boolean>;
  updateTicketPriority: (ticketId: string, priority: 'low' | 'medium' | 'high' | 'critical') => Promise<boolean>;
  addAdminNotes: (ticketId: string, notes: string) => Promise<boolean>;
  getFeedbackStats: () => Promise<void>;
}

export const useFeedback = (): UseFeedbackReturn => {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [allTickets, setAllTickets] = useState<FeedbackTicket[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isSuperAdmin } = useAuth();

  // Fetch user's own tickets - SIMPLIFIED VERSION
  const fetchUserTickets = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching tickets for user:', user.email, 'ID:', user.id);
      
      // Build query that checks both user_id and contact_email
      let query = supabase
        .from('feedback_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Use OR to match either user_id or contact_email
      if (user.email) {
        query = query.or(`user_id.eq.${user.id},contact_email.eq.${user.email}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching user tickets:', fetchError);
        throw fetchError;
      }

      console.log('Fetched', data?.length || 0, 'tickets for user');

      // Simple mapping without complex transformations
      const formattedTickets: FeedbackTicket[] = (data || []).map(ticket => ({
        id: ticket.id,
        userId: ticket.user_id,
        contactEmail: ticket.contact_email || undefined,
        type: ticket.type,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        adminNotes: ticket.admin_notes,
        attachmentUrls: ticket.attachment_urls || [],
        userAgent: ticket.user_agent,
        pageUrl: ticket.page_url,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at,
        resolvedBy: ticket.resolved_by,
        user: null, // Skip profile lookups for now
        resolver: null // Skip profile lookups for now
      }));

      setTickets(formattedTickets);
      
    } catch (err) {
      console.error('Error fetching user tickets:', err);
      // Don't show error for normal users, just log it
      console.log('Silently handling ticket fetch error for user');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch all tickets (admin only)
  const fetchAllTickets = useCallback(async (filters: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    if (!user || !isSuperAdmin) return;

    setLoadingAdmin(true);
    setError(null);

    try {
      // Build query - try simple select first
      let query = supabase
        .from('feedback_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Add filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Get unique user IDs from tickets
      const userIds = [...new Set(data?.filter(t => t.user_id).map(t => t.user_id) || [])];
      
      // Fetch all profiles in one query
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email, user_id')
          .in('user_id', userIds);
        
        if (profiles) {
          profiles.forEach(profile => {
            profilesMap.set(profile.user_id, profile);
          });
        }
      }
      
      // Map tickets with profile data
      const formattedTickets: FeedbackTicket[] = (data || []).map(ticket => {
        const profile = ticket.user_id ? profilesMap.get(ticket.user_id) : null;
        
        // Create user object from profile or contact_email
        const user = profile ? {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: 'member'
        } : ticket.contact_email ? {
          id: 'anonymous',
          name: ticket.contact_email.split('@')[0],
          email: ticket.contact_email,
          role: 'guest'
        } : null;
        
        return {
          id: ticket.id,
          userId: ticket.user_id,
          contactEmail: ticket.contact_email || undefined,
          type: ticket.type,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          adminNotes: ticket.admin_notes,
          attachmentUrls: ticket.attachment_urls || [],
          userAgent: ticket.user_agent,
          pageUrl: ticket.page_url,
          createdAt: ticket.created_at,
          updatedAt: ticket.updated_at,
          resolvedAt: ticket.resolved_at,
          resolvedBy: ticket.resolved_by,
          user,
          resolver: null
        };
      });
      
      setAllTickets(formattedTickets);
      console.log('Admin: Loaded', formattedTickets.length, 'tickets');
      
    } catch (err) {
      console.error('Error fetching all tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch all tickets');
    } finally {
      setLoadingAdmin(false);
    }
  }, [user, isSuperAdmin]);

  // Get feedback stats (admin only)
  const getFeedbackStats = useCallback(async () => {
    if (!user || !isSuperAdmin) return;

    try {
      const { data: tickets, error } = await supabase
        .from('feedback_tickets')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // Calculate stats from the tickets
      const stats: FeedbackStats = {
        totalTickets: tickets?.length || 0,
        openTickets: tickets?.filter(t => t.status === 'open').length || 0,
        inProgressTickets: tickets?.filter(t => t.status === 'in_progress').length || 0,
        resolvedTickets: tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0,
        bugCount: tickets?.filter(t => t.type === 'bug').length || 0,
        featureCount: tickets?.filter(t => t.type === 'feature').length || 0,
        feedbackCount: tickets?.filter(t => t.type === 'feedback').length || 0,
        memberCount: tickets?.filter(t => t.type === 'member').length || 0,
        avgResolutionTimeHours: 0 // Would need more complex calculation
      };
      
      setFeedbackStats(stats);
      console.log('Admin: Loaded feedback stats:', stats);
      
    } catch (err) {
      console.error('Error fetching feedback stats:', err);
    }
  }, [user, isSuperAdmin]);

  // Submit new feedback
  const submitFeedback = useCallback(async (data: {
    type: 'bug' | 'feature' | 'feedback' | 'member';
    title: string;
    description: string;
    contactEmail?: string;
    attachmentUrls?: string[];
    userAgent?: string;
    pageUrl?: string;
  }): Promise<boolean> => {
    console.log('submitFeedback called with:', data);
    console.log('Current user:', user);
    
    // Basic validation: need either a user or an email
    if (!user && !data.contactEmail) {
      setError('Please provide an email address so we can follow up on your feedback');
      return false;
    }

    try {
      const { error: submitError } = await supabase
        .from('feedback_tickets')
        .insert({
          type: data.type || 'feedback',
          title: data.title.trim(),
          description: data.description.trim(),
          user_id: user?.id || null,
          contact_email: data.contactEmail || user?.email || null,
          priority: 'medium',
          status: 'open',
          attachment_urls: data.attachmentUrls || [],
          user_agent: data.userAgent || navigator.userAgent,
          page_url: data.pageUrl || window.location.href
        });

      if (submitError) {
        throw submitError;
      }

      console.log('Feedback submitted successfully');
      
      // Refresh tickets if user is logged in
      if (user) {
        await fetchUserTickets();
      }
      
      return true;
      
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      return false;
    }
  }, [user, fetchUserTickets]);

  // Update ticket status (admin only)
  const updateTicketStatus = useCallback(async (
    ticketId: string, 
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
    adminNotes?: string
  ): Promise<boolean> => {
    console.log('updateTicketStatus called:', { ticketId, status, user: user?.email, isSuperAdmin });
    
    if (!user || !isSuperAdmin) {
      console.error('Not authorized: user:', user?.email, 'isSuperAdmin:', isSuperAdmin);
      return false;
    }

    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }
      
      // Add resolved timestamp if marking as resolved or closed
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
      }

      console.log('Updating ticket with data:', updateData);

      const { data, error: updateError } = await supabase
        .from('feedback_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select();

      console.log('Update result:', { data, error: updateError });

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }

      // Refresh tickets
      await fetchAllTickets();
      if (isSuperAdmin) {
        await getFeedbackStats();
      }
      
      console.log('Ticket status updated successfully');
      return true;
      
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update ticket status');
      return false;
    }
  }, [user, isSuperAdmin, fetchAllTickets, getFeedbackStats]);

  // Update ticket priority (admin only)
  const updateTicketPriority = useCallback(async (
    ticketId: string, 
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<boolean> => {
    if (!user || !isSuperAdmin) return false;

    try {
      const { error: updateError } = await supabase
        .from('feedback_tickets')
        .update({ priority })
        .eq('id', ticketId);

      if (updateError) {
        throw updateError;
      }

      // Refresh tickets
      await fetchAllTickets();
      return true;
      
    } catch (err) {
      console.error('Error updating ticket priority:', err);
      setError(err instanceof Error ? err.message : 'Failed to update ticket priority');
      return false;
    }
  }, [user, isSuperAdmin, fetchAllTickets]);

  // Add admin notes
  const addAdminNotes = useCallback(async (
    ticketId: string, 
    notes: string
  ): Promise<boolean> => {
    if (!user || !isSuperAdmin) return false;

    try {
      const { error: updateError } = await supabase
        .from('feedback_tickets')
        .update({ admin_notes: notes })
        .eq('id', ticketId);

      if (updateError) {
        throw updateError;
      }

      // Refresh tickets
      await fetchAllTickets();
      return true;
      
    } catch (err) {
      console.error('Error adding admin notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to add admin notes');
      return false;
    }
  }, [user, isSuperAdmin, fetchAllTickets]);

  const refreshTickets = useCallback(async () => {
    await fetchUserTickets();
  }, [fetchUserTickets]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchUserTickets();
    }
  }, [user, fetchUserTickets]);

  return {
    // User functions
    tickets,
    loading,
    error,
    submitFeedback,
    refreshTickets,
    
    // Admin functions
    allTickets,
    feedbackStats,
    loadingAdmin,
    fetchAllTickets,
    updateTicketStatus,
    updateTicketPriority,
    addAdminNotes,
    getFeedbackStats
  };
};