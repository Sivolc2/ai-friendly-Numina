import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Organization, Invitation, EventParticipant, OrganizationMember } from '../types';

export const useOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedOrganizations: Organization[] = data.map(org => ({
        id: org.id,
        name: org.name,
        description: org.description,
        organizationType: org.organization_type,
        website: org.website,
        location: org.location,
        coverImage: org.cover_image,
        adminProfileId: org.admin_profile_id,
        isActive: org.is_active,
        memberCount: org.member_count,
        eventCount: org.event_count,
        createdAt: org.created_at,
        updatedAt: org.updated_at
      }));

      setOrganizations(mappedOrganizations);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrganization = useCallback(async (organizationData: {
    name: string;
    description?: string;
    organizationType?: Organization['organizationType'];
    website?: string;
    location?: string;
    coverImage?: string;
    adminProfileId: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: organizationData.name,
          description: organizationData.description,
          organization_type: organizationData.organizationType || 'meetup',
          website: organizationData.website,
          location: organizationData.location,
          cover_image: organizationData.coverImage,
          admin_profile_id: organizationData.adminProfileId,
          is_active: true,
          member_count: 1,
          event_count: 0
        }])
        .select()
        .single();

      if (error) throw error;

      const newOrganization: Organization = {
        id: data.id,
        name: data.name,
        description: data.description,
        organizationType: data.organization_type,
        website: data.website,
        location: data.location,
        coverImage: data.cover_image,
        adminProfileId: data.admin_profile_id,
        isActive: data.is_active,
        memberCount: data.member_count,
        eventCount: data.event_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      setOrganizations(prev => [newOrganization, ...prev]);
      return newOrganization;
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to create organization');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvitation = useCallback(async (invitationData: {
    eventId: string;
    organizationId?: string;
    inviterId: string;
    inviteeEmail: string;
    invitationType?: Invitation['invitationType'];
    personalMessage?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert([{
          event_id: invitationData.eventId,
          organization_id: invitationData.organizationId,
          inviter_id: invitationData.inviterId,
          invitee_email: invitationData.inviteeEmail,
          invitation_type: invitationData.invitationType || 'event_participant',
          personal_message: invitationData.personalMessage,
          status: 'pending'
        }])
        .select(`
          *,
          events:event_id(*),
          organizations:organization_id(*),
          inviter:inviter_id(*)
        `)
        .single();

      if (error) throw error;

      const invitation: Invitation = {
        id: data.id,
        eventId: data.event_id,
        organizationId: data.organization_id,
        inviterId: data.inviter_id,
        inviteeEmail: data.invitee_email,
        invitationCode: data.invitation_code,
        invitationType: data.invitation_type,
        status: data.status,
        personalMessage: data.personal_message,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        acceptedAt: data.accepted_at,
        event: data.events,
        organization: data.organizations,
        inviter: data.inviter
      };

      return invitation;
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invitation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvitation = useCallback(async (invitationCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_code: invitationCode
      });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInvitation = useCallback(async (invitationCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          events:event_id(*),
          organizations:organization_id(*),
          inviter:inviter_id(*)
        `)
        .eq('invitation_code', invitationCode)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;

      const invitation: Invitation = {
        id: data.id,
        eventId: data.event_id,
        organizationId: data.organization_id,
        inviterId: data.inviter_id,
        inviteeEmail: data.invitee_email,
        invitationCode: data.invitation_code,
        invitationType: data.invitation_type,
        status: data.status,
        personalMessage: data.personal_message,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        acceptedAt: data.accepted_at,
        event: data.events,
        organization: data.organizations,
        inviter: data.inviter
      };

      return invitation;
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError(err instanceof Error ? err.message : 'Invalid or expired invitation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEventParticipants = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          profiles:profile_id(*)
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      const participants: EventParticipant[] = data.map(participant => ({
        id: participant.id,
        eventId: participant.event_id,
        profileId: participant.profile_id,
        participationType: participant.participation_type,
        invitedBy: participant.invited_by,
        invitationId: participant.invitation_id,
        joinedAt: participant.joined_at,
        profile: participant.profiles
      }));

      return participants;
    } catch (err) {
      console.error('Error fetching event participants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch event participants');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrganizationMembers = useCallback(async (organizationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          profiles:profile_id(*),
          first_event:first_event_id(*)
        `)
        .eq('organization_id', organizationId);

      if (error) throw error;

      const members: OrganizationMember[] = data.map(member => ({
        id: member.id,
        organizationId: member.organization_id,
        profileId: member.profile_id,
        memberType: member.member_type,
        firstEventId: member.first_event_id,
        eventsAttended: member.events_attended,
        lastEventAttended: member.last_event_attended,
        joinedAt: member.joined_at,
        profile: member.profiles,
        firstEvent: member.first_event
      }));

      return members;
    } catch (err) {
      console.error('Error fetching organization members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organization members');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    organizations,
    loading,
    error,
    fetchOrganizations,
    createOrganization,
    createInvitation,
    acceptInvitation,
    fetchInvitation,
    fetchEventParticipants,
    fetchOrganizationMembers
  };
};