import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Invitation } from '../types';
import { useOrganizations } from '../hooks/useOrganizations';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

interface InvitationPageProps {
  invitationCode: string;
  onAcceptComplete?: (eventId: string, organizationId?: string) => void;
}

export const InvitationPage: React.FC<InvitationPageProps> = ({ 
  invitationCode, 
  onAcceptComplete 
}) => {
  const { user } = useAuth();
  const { fetchInvitation, acceptInvitation, loading, error } = useOrganizations();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        const inviteData = await fetchInvitation(invitationCode);
        setInvitation(inviteData);
      } catch (err) {
        console.error('Error loading invitation:', err);
      }
    };

    if (invitationCode) {
      loadInvitation();
    }
  }, [invitationCode, fetchInvitation]);

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    setAccepting(true);
    try {
      const result = await acceptInvitation(invitationCode);
      if (result.success) {
        setAccepted(true);
        if (onAcceptComplete) {
          onAcceptComplete(result.event_id, result.organization_id);
        }
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Invalid Invitation
            </h2>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired. Please contact the person who sent it for a new invitation.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to the Community!
            </h2>
            <p className="text-gray-600 mb-6">
              Your invitation has been accepted. You're now part of {invitation.event?.name} and can connect with other attendees.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center justify-center space-x-2 w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span>Continue to Profile Setup</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              You're Invited!
            </h1>
            <p className="text-gray-600 mt-2">
              Join an amazing community of event attendees
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Event Header */}
          {invitation.event?.coverImage && (
            <div className="relative h-48">
              <img
                src={invitation.event.coverImage}
                alt={invitation.event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          )}

          <div className="p-6">
            {/* Event Info */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {invitation.event?.name}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {invitation.event?.date 
                      ? new Date(invitation.event.date).toLocaleDateString()
                      : 'Date TBD'
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{invitation.event?.location}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{invitation.event?.participantCount || 0} attendees</span>
                </div>
              </div>
              {invitation.event?.description && (
                <p className="text-gray-700 mt-3">
                  {invitation.event.description}
                </p>
              )}
            </div>

            {/* Organization Info */}
            {invitation.organization && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Organization
                </h3>
                <div className="flex items-center space-x-3">
                  {invitation.organization.coverImage && (
                    <img
                      src={invitation.organization.coverImage}
                      alt={invitation.organization.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {invitation.organization.name}
                    </h4>
                    {invitation.organization.description && (
                      <p className="text-sm text-gray-600">
                        {invitation.organization.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Personal Message */}
            {invitation.personalMessage && (
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Personal Message from {invitation.inviter?.name}
                </h3>
                <p className="text-gray-700 italic">
                  "{invitation.personalMessage}"
                </p>
              </div>
            )}

            {/* Inviter Info */}
            <div className="mb-6 flex items-center space-x-3">
              {invitation.inviter?.coverPhoto && (
                <img
                  src={invitation.inviter.coverPhoto}
                  alt={invitation.inviter.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm text-gray-600">Invited by</p>
                <p className="font-medium text-gray-900">
                  {invitation.inviter?.name}
                </p>
                {invitation.inviter?.role && (
                  <p className="text-sm text-gray-600">
                    {invitation.inviter.role}
                  </p>
                )}
              </div>
            </div>

            {/* Accept Button */}
            <div className="space-y-4">
              {!user ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Sign in to accept this invitation and join the community
                  </p>
                  <button
                    onClick={() => {
                      // This would typically redirect to auth flow
                      window.location.href = '/auth';
                    }}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Sign In to Accept Invitation
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAcceptInvitation}
                  disabled={accepting}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                >
                  {accepting ? (
                    <>
                      <LoadingSpinner />
                      <span>Accepting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Accept Invitation</span>
                    </>
                  )}
                </button>
              )}

              <p className="text-xs text-gray-500 text-center">
                By accepting, you'll be able to connect with other event attendees and join the community
              </p>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-purple-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Complete your profile</p>
                <p className="text-sm text-gray-600">Share your story and upload photos from the event</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-purple-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Connect with attendees</p>
                <p className="text-sm text-gray-600">Browse other profiles and start conversations</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-purple-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Join communities</p>
                <p className="text-sm text-gray-600">Participate in ongoing discussions and future events</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};