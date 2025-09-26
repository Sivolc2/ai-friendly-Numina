import React, { useState, useEffect } from 'react';
import { Users, Calendar, MapPin, Globe, Plus, Send, Copy, Check, Building } from 'lucide-react';
import { Organization, Event, Invitation } from '../types';
import { useOrganizations } from '../hooks/useOrganizations';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../hooks/useFeedback';

export const CommunityManager: React.FC = () => {
  const { user, userProfile, isAdmin, isPhotographer } = useAuth();
  const { createOrganization, createInvitation, loading: orgLoading, error: orgError } = useOrganizations();
  const { submitFeedback, loading: feedbackLoading, error: feedbackError } = useFeedback();
  
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'members' | 'invitations'>('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Form states
  const [orgForm, setOrgForm] = useState({
    name: '',
    description: '',
    organizationType: 'meetup' as const,
    website: '',
    location: '',
    coverImage: ''
  });

  const [inviteForm, setInviteForm] = useState({
    eventId: '',
    inviteeEmail: '',
    personalMessage: '',
    invitationType: 'event_participant' as const
  });

  const [createdInvitation, setCreatedInvitation] = useState<Invitation | null>(null);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      const newOrg = await createOrganization({
        ...orgForm,
        adminProfileId: userProfile.id
      });
      console.log('Community created:', newOrg);
      setShowCreateForm(false);
      // Reset form
      setOrgForm({
        name: '',
        description: '',
        organizationType: 'meetup',
        website: '',
        location: '',
        coverImage: ''
      });
    } catch (err) {
      console.error('Failed to create community:', err);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !selectedOrganization) return;

    try {
      const invitation = await createInvitation({
        ...inviteForm,
        organizationId: selectedOrganization.id,
        inviterId: userProfile.id
      });
      setCreatedInvitation(invitation);
      setInviteForm({
        eventId: '',
        inviteeEmail: '',
        personalMessage: '',
        invitationType: 'event_participant'
      });
    } catch (err) {
      console.error('Failed to create invitation:', err);
    }
  };

  const handleCopyInvitationLink = async (invitation: Invitation) => {
    const inviteLink = `${window.location.origin}/invite/${invitation.invitationCode}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedCode(invitation.invitationCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy invitation link:', err);
    }
  };

  const handleCommunityRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    const fullMessage = `Community Request: ${requestMessage || 'I would like to start a new community.'}`;
    
    const result = await submitFeedback({
      message: fullMessage,
      type: 'feature_request',
      category: 'community'
    });

    if (result) {
      setRequestSent(true);
      setRequestMessage('');
      setShowRequestForm(false);
      setTimeout(() => setRequestSent(false), 5000);
    }
  };

  // Show admin/photographer view if they have permission
  const canManageCommunities = user && (isAdmin || isPhotographer);

  // If admin/photographer and showing create form
  if (canManageCommunities && showCreateForm) {
    return (
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create Community</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateOrganization} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Name *
            </label>
            <input
              type="text"
              value={orgForm.name}
              onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="San Francisco Tech Meetup"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={orgForm.description}
              onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="A community for tech enthusiasts to connect and learn together..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Type
            </label>
            <select
              value={orgForm.organizationType}
              onChange={(e) => setOrgForm({ ...orgForm, organizationType: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="meetup">Meetup</option>
              <option value="club">Club</option>
              <option value="nonprofit">Nonprofit</option>
              <option value="company">Company</option>
              <option value="conference">Conference</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={orgForm.website}
                onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://sftechmeetup.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={orgForm.location}
                onChange={(e) => setOrgForm({ ...orgForm, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="San Francisco, CA"
              />
            </div>
          </div>

          {orgError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {orgError}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={orgLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {orgLoading ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // If admin/photographer and showing organization details
  if (canManageCommunities && selectedOrganization) {
    return (
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {selectedOrganization.coverImage && (
                <img
                  src={selectedOrganization.coverImage}
                  alt={selectedOrganization.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedOrganization.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{selectedOrganization.memberCount || 0} members</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{selectedOrganization.eventCount || 0} events</span>
                  </div>
                  {selectedOrganization.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{selectedOrganization.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowInviteForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Invite</span>
              </button>
              <button
                onClick={() => setSelectedOrganization(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['overview', 'events', 'members', 'invitations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedOrganization.description || 'No description available.'}
                </p>
              </div>

              {selectedOrganization.website && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Website</h3>
                  <a
                    href={selectedOrganization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                  >
                    <Globe className="h-4 w-4" />
                    <span>{selectedOrganization.website}</span>
                  </a>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedOrganization.memberCount || 0}</div>
                    <div className="text-sm text-gray-600">Total Members</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedOrganization.eventCount || 0}</div>
                    <div className="text-sm text-gray-600">Events Hosted</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Date(selectedOrganization.createdAt).getFullYear()}
                    </div>
                    <div className="text-sm text-gray-600">Year Founded</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Events</h3>
              <p className="text-gray-600">Event management coming soon...</p>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Members</h3>
              <p className="text-gray-600">Member management coming soon...</p>
            </div>
          )}

          {activeTab === 'invitations' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invitations</h3>
              {createdInvitation && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Invitation Created!</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/invite/${createdInvitation.invitationCode}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                    />
                    <button
                      onClick={() => handleCopyInvitationLink(createdInvitation)}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      {copiedCode === createdInvitation.invitationCode ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span>{copiedCode === createdInvitation.invitationCode ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
              <p className="text-gray-600">Invitation management coming soon...</p>
            </div>
          )}
        </div>

        {/* Invite Form Modal */}
        {showInviteForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create Invitation</h3>
                  <button
                    onClick={() => setShowInviteForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateInvitation} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event ID *
                  </label>
                  <input
                    type="text"
                    value={inviteForm.eventId}
                    onChange={(e) => setInviteForm({ ...inviteForm, eventId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter event ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={inviteForm.inviteeEmail}
                    onChange={(e) => setInviteForm({ ...inviteForm, inviteeEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="invitee@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message
                  </label>
                  <textarea
                    value={inviteForm.personalMessage}
                    onChange={(e) => setInviteForm({ ...inviteForm, personalMessage: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Hey! I'd love for you to join our community..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={orgLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{orgLoading ? 'Creating...' : 'Create Invite'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default main view for admin/photographer OR regular users
  return (
    <div className="space-y-6">
      {/* Top Banner Block - Community Image */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-br from-purple-100 to-blue-100 h-64 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-20 w-20 text-purple-600 mx-auto mb-4" />
            <p className="text-purple-800 font-medium text-lg">Happy people connecting together</p>
            <p className="text-purple-600 text-sm mt-2">Communities coming soon!</p>
          </div>
        </div>
      </div>

      {/* Content Block - Title, Subtitle, Actions */}
      <div className="bg-gray-50 rounded-xl p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Community</h2>
            <p className="text-lg text-gray-600">
              Build and join communities of like-minded people who share your interests and passions.
            </p>
          </div>

          {/* Admin/Photographer Actions */}
          {canManageCommunities && (
            <div className="mb-8 flex justify-center">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Building className="h-5 w-5" />
                <span>Create New Community</span>
              </button>
            </div>
          )}

          {/* Request Button Section for Regular Users */}
          {!canManageCommunities && (
            <div className="text-center mb-8">
              {requestSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800 font-medium">
                    Thank you! Your community request has been submitted.
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    We'll review your request and get back to you soon.
                  </p>
                </div>
              ) : (
                <>
                  {!showRequestForm ? (
                    <button
                      onClick={() => setShowRequestForm(true)}
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <Users className="h-5 w-5" />
                      <span>Request to Start a Community</span>
                    </button>
                  ) : (
                    <div className="bg-white rounded-lg p-6 max-w-md mx-auto border border-gray-200">
                      <form onSubmit={handleCommunityRequest} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                            Tell us about your community idea
                          </label>
                          <textarea
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="What kind of community would you like to create? Who would it be for?"
                            required
                          />
                        </div>

                        {feedbackError && (
                          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            {feedbackError}
                          </div>
                        )}

                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowRequestForm(false);
                              setRequestMessage('');
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={feedbackLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                          >
                            <Send className="h-4 w-4" />
                            <span>{feedbackLoading ? 'Sending...' : 'Send Request'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Bottom Message */}
          <div className="text-center text-gray-600">
            <p className="text-sm">
              {canManageCommunities 
                ? 'Create and manage communities for your events and meetups.'
                : 'Communities are a new feature we\'re building. Be the first to know when they launch!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};