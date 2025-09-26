import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Calendar, Trash2, Send, AlertCircle, CheckCircle, Building } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { Profile, Invitation } from '../types';

export const TeamManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'photographer' as 'photographer' | 'organiser',
    personalMessage: ''
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const { 
    invitations,
    getTeamMembers, 
    createInvitation, 
    revokeInvitation, 
    fetchInvitations,
    updateUserRole
  } = useData();
  const { user, isSuperAdmin } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const members = await getTeamMembers();
      setTeamMembers(members);
      await fetchInvitations();
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    
    if (!inviteForm.email.trim()) {
      setInviteError('Email is required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) {
      setInviteError('Please enter a valid email address');
      return;
    }

    setInviteLoading(true);
    
    try {
      await createInvitation(
        inviteForm.email, 
        inviteForm.role, 
        inviteForm.personalMessage || undefined
      );
      
      setInviteSuccess(`Invitation sent to ${inviteForm.email}`);
      setInviteForm({ email: '', role: 'photographer', personalMessage: '' });
      setInviteModalOpen(false);
      
      // Reload invitations to show the new one
      await fetchInvitations();
      
    } catch (error: any) {
      setInviteError(error.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    
    try {
      await revokeInvitation(invitationId);
      setInviteSuccess('Invitation revoked successfully');
    } catch (error: any) {
      setInviteError(error.message || 'Failed to revoke invitation');
    }
  };

  const handleRoleChange = async (profileId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to "${newRole}"?`)) return;
    
    try {
      await updateUserRole(profileId, newRole);
      await loadData(); // Reload team members
      setInviteSuccess('User role updated successfully');
    } catch (error: any) {
      setInviteError(error.message || 'Failed to update user role');
    }
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="ml-2 text-gray-600">Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600">Manage your photography team and invitations</p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {inviteSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{inviteSuccess}</span>
            <button
              onClick={() => setInviteSuccess('')}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {inviteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{inviteError}</span>
            <button
              onClick={() => setInviteError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Team Members ({teamMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'invitations'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Invitations ({pendingInvitations.length})
        </button>
      </div>

      {/* Team Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Team Members</h3>
          </div>
          
          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-500 mb-4">Invite photographers and organizers to join your team</p>
              <button
                onClick={() => setInviteModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Send First Invitation</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-700 font-medium text-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="photographer">Photographer</option>
                          <option value="organiser">Organiser</option>
                          {isSuperAdmin && <option value="admin">Admin</option>}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.hasCompletedProfile 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {member.hasCompletedProfile ? 'Active' : 'Pending Profile'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.invitationAcceptedAt 
                          ? new Date(member.invitationAcceptedAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-purple-600 hover:text-purple-900">
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          {/* Pending Invitations */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
            </div>
            
            {pendingInvitations.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No pending invitations</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingInvitations.map((invitation) => (
                      <tr key={invitation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invitation.inviteeEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {invitation.invitationType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleRevokeInvitation(invitation.id)}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Revoke</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Accepted Invitations */}
          {acceptedInvitations.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recently Accepted</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accepted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {acceptedInvitations.slice(0, 5).map((invitation) => (
                      <tr key={invitation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invitation.inviteeEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {invitation.invitationType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invitation.acceptedAt 
                            ? new Date(invitation.acceptedAt).toLocaleDateString()
                            : 'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
            
            <form onSubmit={handleInvite} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="colleague@example.com"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as 'photographer' | 'organiser' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="photographer">Photographer</option>
                  <option value="organiser">Organiser</option>
                </select>
              </div>

              {/* Personal Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteForm.personalMessage}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, personalMessage: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add a personal note to your invitation..."
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {inviteLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};