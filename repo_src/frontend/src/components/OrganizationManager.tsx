import React, { useState, useEffect } from 'react';
import { Users, Calendar, MapPin, Globe, Plus, Send, Copy, Check } from 'lucide-react';
import { Organization, Event, Invitation } from '../types';
import { useOrganizations } from '../hooks/useOrganizations';
import { useAuth } from '../contexts/AuthContext';

interface OrganizationManagerProps {
  organization?: Organization;
  onClose: () => void;
}

export const OrganizationManager: React.FC<OrganizationManagerProps> = ({ 
  organization, 
  onClose 
}) => {
  const { user, userProfile } = useAuth();
  const { createOrganization, createInvitation, loading, error } = useOrganizations();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'members' | 'invitations'>('overview');
  const [showCreateForm, setShowCreateForm] = useState(!organization);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [orgForm, setOrgForm] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    organizationType: organization?.organizationType || 'meetup' as const,
    website: organization?.website || '',
    location: organization?.location || '',
    coverImage: organization?.coverImage || ''
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
      console.log('Organization created:', newOrg);
      setShowCreateForm(false);
      // Could trigger a refresh of organizations list here
    } catch (err) {
      console.error('Failed to create organization:', err);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      const invitation = await createInvitation({
        ...inviteForm,
        organizationId: organization?.id,
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

  if (showCreateForm) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Create Organization</h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateOrganization} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
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
                Organization Type
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

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {organization?.coverImage && (
                <img
                  src={organization.coverImage}
                  alt={organization.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{organization?.name}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{organization?.memberCount || 0} members</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{organization?.eventCount || 0} events</span>
                  </div>
                  {organization?.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{organization.location}</span>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                  {organization?.description || 'No description available.'}
                </p>
              </div>

              {organization?.website && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Website</h3>
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                  >
                    <Globe className="h-4 w-4" />
                    <span>{organization.website}</span>
                  </a>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{organization?.memberCount || 0}</div>
                    <div className="text-sm text-gray-600">Total Members</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{organization?.eventCount || 0}</div>
                    <div className="text-sm text-gray-600">Events Hosted</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {organization ? new Date(organization.createdAt).getFullYear() : '2024'}
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
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowInviteForm(false);
              }
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create Invitation</h3>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowInviteForm(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowInviteForm(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{loading ? 'Creating...' : 'Create Invite'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};