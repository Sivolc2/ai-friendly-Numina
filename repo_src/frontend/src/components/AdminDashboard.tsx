import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Users, Calendar, Mail, BarChart3, Settings, Eye, Send, Plus, Edit, Trash2, Tag, Heart, MessageCircle, TrendingUp } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { Question, Tag as TagType, Community, Event } from '../types';
import { CommunityEditModal } from './CommunityEditModal';
import { usePhotoAnalytics, PhotoAnalytics } from '../hooks/usePhotoAnalytics';
import { PhotoAnalyticsSection } from './PhotoAnalyticsSection';
import { useFeedback } from '../hooks/useFeedback';

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'tags' | 'settings' | 'events' | 'notifications' | 'analytics' | 'users' | 'feedback' | 'photos'>('overview');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventEditModalOpen, setCommunityEditModalOpen] = useState(false);
  const [newQuestionForm, setNewQuestionForm] = useState({
    category: 'Story & Values' as Question['category'],
    questionText: '',
    displayOrder: 0,
    isRequired: false,
    isActive: true
  });
  const [newTagName, setNewTagName] = useState('');
  const [photoAnalytics, setPhotoAnalytics] = useState<PhotoAnalytics | null>(null);
  
  const { 
    profiles, 
    events, 
    questions, 
    tags, 
    formSettings,
    fetchAllQuestions,
    createQuestion, 
    updateQuestion, 
    deleteQuestion,
    createTag,
    deleteTag,
    updateFormSetting,
    updateUserRole,
    sendProfileInvitationEmail,
    fetchEvents,
    deleteEvent
  } = useData();
  const { isSuperAdmin, user } = useAuth();
  const { getPhotoInteractionStats } = usePhotoAnalytics();
  const { 
    allTickets, 
    feedbackStats, 
    loadingAdmin: loadingFeedback,
    fetchAllTickets,
    updateTicketStatus,
    updateTicketPriority,
    addAdminNotes,
    getFeedbackStats
  } = useFeedback();

  // Load all questions and initial data for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllQuestions();
      // fetchAllProfilesForAdmin is no longer needed since fetchProfiles handles it
      fetchEvents(); // Load all events/communities on mount
    }
  }, [isSuperAdmin, fetchAllQuestions, fetchEvents]);

  // Load photo analytics and admin data
  useEffect(() => {
    const loadPhotoAnalytics = async () => {
      const analytics = await getPhotoInteractionStats();
      if (analytics) {
        setPhotoAnalytics(analytics);
      }
    };

    if (activeTab === 'analytics') {
      loadPhotoAnalytics();
    }

    if (activeTab === 'feedback' && isSuperAdmin) {
      getFeedbackStats();
      fetchAllTickets();
    }

    // Photos tab no longer needs to fetch profiles separately
  }, [activeTab, getPhotoInteractionStats, isSuperAdmin, getFeedbackStats, fetchAllTickets]);

  const stats = {
    totalProfiles: profiles.length,
    completedProfiles: profiles.filter(p => p.hasCompletedProfile).length,
    pendingProfiles: profiles.filter(p => !p.hasCompletedProfile).length,
    totalEvents: events.length,
    emailsSent: 234,
    emailOpenRate: 68,
  };

  const getParticipantCount = (eventId: string) => {
    return profiles.filter(profile => profile.eventId === eventId).length;
  };

  const recentEvents = events.slice(0, 10).map(event => ({
    id: event.id,
    name: event.name,
    participants: getParticipantCount(event.id),
    date: event.date,
    status: 'completed'
  }));

  const pendingNotifications = [
    { id: '1', event: 'Tech Startup Meetup', emails: 12, status: 'ready' },
    { id: '2', event: 'Design Conference 2024', emails: 23, status: 'draft' },
  ];

  const handleCreateQuestion = async () => {
    try {
      await createQuestion(newQuestionForm);
      setNewQuestionForm({
        category: 'Story & Values',
        questionText: '',
        displayOrder: 0,
        isRequired: false,
        isActive: true
      });
      alert('Question created successfully!');
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Error creating question. Please try again.');
    }
  };

  const handleUpdateQuestion = async (question: Question) => {
    try {
      await updateQuestion(question.id, question);
      setEditingQuestion(null);
      alert('Question updated successfully!');
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Error updating question. Please try again.');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteQuestion(id);
        alert('Question deleted successfully!');
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Error deleting question. Please try again.');
      }
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      await createTag(newTagName.trim());
      setNewTagName('');
      alert('Tag created successfully!');
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Error creating tag. Please try again.');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      try {
        await deleteTag(id);
        alert('Tag deleted successfully!');
      } catch (error) {
        console.error('Error deleting tag:', error);
        alert('Error deleting tag. Please try again.');
      }
    }
  };

  const handleUpdateFormSetting = async (key: string, value: string) => {
    try {
      await updateFormSetting(key, value);
      alert('Setting updated successfully!');
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Error updating setting. Please try again.');
    }
  };

  const handleUpdateUserRole = async (profileId: string, newRole: string) => {
    if (confirm(`Are you sure you want to change this user's role to "${newRole}"?`)) {
      try {
        await updateUserRole(profileId, newRole);
        alert('User role updated successfully!');
      } catch (error) {
        console.error('Error updating user role:', error);
        alert('Error updating user role. Please try again.');
      }
    }
  };

  const handleResendEmail = async (profile: any) => {
    if (confirm(`Resend invitation email to ${profile.email}?`)) {
      try {
        // Find the event for this profile
        const event = events.find(e => e.id === profile.eventId);
        if (!event) {
          alert('Event not found for this profile');
          return;
        }
        
        // Send the invitation email with proper profile and event URLs
        await sendProfileInvitationEmail(
          profile.email,
          profile.name || profile.email.split('@')[0] || 'Participant',
          event.name,
          profile.id,
          event.id
        );
        alert('Invitation email sent successfully!');
      } catch (error) {
        console.error('Error sending email:', error);
        alert('Error sending email. Please try again.');
      }
    }
  };

  const canEditEvent = (event: Event) => {
    if (!user) return false;
    // Super admins can edit any event
    if (isSuperAdmin) return true;
    // Regular users (photographers) can only edit their own events
    return event.userId === user.id;
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setCommunityEditModalOpen(true);
  };

  const handleEventSaved = (updatedEvent: Event) => {
    // The updateEvent function in useData will handle refetching events
    // But we also need to update the current event if it's being viewed
    console.log('Event saved successfully:', updatedEvent);
    setEditingEvent(null);
    setCommunityEditModalOpen(false);
  };

  const handleCloseEventModal = () => {
    setEditingEvent(null);
    setCommunityEditModalOpen(false);
  };

  const handleDeleteEvent = async (event: Event) => {
    const participantCount = getParticipantCount(event.id);
    
    if (participantCount > 0) {
      const confirmMessage = `This event has ${participantCount} participant${participantCount === 1 ? '' : 's'}. Deleting this event will NOT delete the participant profiles, but they will no longer be associated with this event. Are you sure you want to continue?`;
      if (!confirm(confirmMessage)) return;
    } else {
      if (!confirm(`Are you sure you want to delete the event "${event.name}"? This action cannot be undone.`)) return;
    }

    try {
      await deleteEvent(event.id);
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Directory</span>
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap space-x-1 bg-gray-200 p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'questions'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Questions
            </button>
          )}
          <button
            onClick={() => setActiveTab('tags')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tags'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tags
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Users
            </button>
          )}
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'feedback'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Feedback
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'photos'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Photos
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Profiles</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalProfiles}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Profiles</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completedProfiles}</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Profiles</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.pendingProfiles}</p>
                  </div>
                  <Settings className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-3xl font-bold text-teal-600">{stats.totalEvents}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-teal-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Questions</p>
                    <p className="text-3xl font-bold text-indigo-600">{questions.length}</p>
                  </div>
                  <Mail className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Tags</p>
                    <p className="text-3xl font-bold text-pink-600">{tags.length}</p>
                  </div>
                  <Tag className="h-8 w-8 text-pink-600" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h2>
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-600">{event.participants} participants • {event.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.status === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Question Management</h2>
            </div>
            
            {/* Add New Question */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Question</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newQuestionForm.category}
                    onChange={(e) => setNewQuestionForm(prev => ({ ...prev, category: e.target.value as Question['category'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Story & Values">Story & Values</option>
                    <option value="Joy & Humanity">Joy & Humanity</option>
                    <option value="Passion & Dreams">Passion & Dreams</option>
                    <option value="Optional Fun">Optional Fun</option>
                    <option value="Connection">Connection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                  <input
                    type="number"
                    value={newQuestionForm.displayOrder}
                    onChange={(e) => setNewQuestionForm(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                <textarea
                  value={newQuestionForm.questionText}
                  onChange={(e) => setNewQuestionForm(prev => ({ ...prev, questionText: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your question..."
                />
              </div>
              <div className="mt-4 flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newQuestionForm.isRequired}
                    onChange={(e) => setNewQuestionForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Required</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newQuestionForm.isActive}
                    onChange={(e) => setNewQuestionForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleCreateQuestion}
                  disabled={!newQuestionForm.questionText.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>
            
            {/* Questions List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Existing Questions ({questions.length})</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {questions.map((question) => (
                  <div key={question.id} className="p-6">
                    {editingQuestion?.id === question.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                            <select
                              value={editingQuestion.category}
                              onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, category: e.target.value as Question['category'] } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              <option value="Story & Values">Story & Values</option>
                              <option value="Joy & Humanity">Joy & Humanity</option>
                              <option value="Passion & Dreams">Passion & Dreams</option>
                              <option value="Optional Fun">Optional Fun</option>
                              <option value="Connection">Connection</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                            <input
                              type="number"
                              value={editingQuestion.displayOrder}
                              onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, displayOrder: parseInt(e.target.value) || 0 } : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                          <textarea
                            value={editingQuestion.questionText}
                            onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, questionText: e.target.value } : null)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingQuestion.isRequired}
                              onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, isRequired: e.target.checked } : null)}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Required</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingQuestion.isActive}
                              onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Active</span>
                          </label>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateQuestion(editingQuestion)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingQuestion(null)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {question.category}
                            </span>
                            <span className="text-xs text-gray-500">Order: {question.displayOrder}</span>
                            {question.isRequired && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                Required
                              </span>
                            )}
                            {!question.isActive && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium">{question.questionText}</p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setEditingQuestion(question)}
                            className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Tag Management</h2>
            </div>
            
            {/* Add New Tag */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Tag</h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter tag name..."
                />
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Tag</span>
                </button>
              </div>
            </div>
            
            {/* Tags List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Tags ({tags.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-gray-900 font-medium">{tag.tagName}</span>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Form Settings</h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-6">
                {formSettings.map((setting) => (
                  <div key={setting.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {setting.settingKey === 'connect_tab_enabled' 
                        ? 'Enable Connect Features (Social Links & Messaging)'
                        : setting.settingKey === 'ai_generation_enabled'
                        ? 'AI Story Generation'
                        : setting.settingKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    {setting.settingKey === 'connect_tab_enabled' && (
                      <p className="text-xs text-gray-500 mb-2">
                        Controls whether users can add social media, messenger platforms, and custom links to their profiles
                      </p>
                    )}
                    {(setting.settingKey === 'ai_generation_enabled' || setting.settingKey === 'connect_tab_enabled') ? (
                      <select
                        value={setting.settingValue}
                        onChange={(e) => handleUpdateFormSetting(setting.settingKey, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    ) : (
                      <textarea
                        value={setting.settingValue}
                        onChange={(e) => handleUpdateFormSetting(setting.settingKey, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Event Management</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Upload className="h-4 w-4" />
                <span>New Upload Session</span>
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{event.name}</div>
                        <div className="text-sm text-gray-500">{event.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getParticipantCount(event.id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          event.isPrivate 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {event.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {canEditEvent(event) ? (
                          <button 
                            onClick={() => handleEditEvent(event)}
                            className="text-purple-600 hover:text-purple-900 transition-colors"
                          >
                            Edit
                          </button>
                        ) : (
                          <span className="text-gray-400">No access</span>
                        )}
                        <button className="text-gray-600 hover:text-gray-900 transition-colors">
                          View
                        </button>
                        {isSuperAdmin && (
                          <button 
                            onClick={() => handleDeleteEvent(event)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Email Notifications</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                <Send className="h-4 w-4" />
                <span>Send Batch</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingNotifications.map((notification) => (
                <div key={notification.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">{notification.event}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      notification.status === 'ready' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {notification.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {notification.emails} participants ready for notification
                  </p>
                  <div className="flex space-x-2">
                    <button className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                      Send Now
                    </button>
                    <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-medium text-gray-900 mb-4">Profile Completion Rate</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span>{Math.round((stats.completedProfiles / stats.totalProfiles) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(stats.completedProfiles / stats.totalProfiles) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.emailsSent}</p>
                  </div>
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email Open Rate</p>
                    <p className="text-3xl font-bold text-indigo-600">{stats.emailOpenRate}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">New profile completed</span>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Email batch sent (24 recipients)</span>
                  <span className="text-xs text-gray-500">5 hours ago</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">New event uploaded</span>
                  <span className="text-xs text-gray-500">1 day ago</span>
                </div>
              </div>
            </div>

            {/* Photo Engagement Analytics */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo Engagement Analytics</h3>
              <PhotoAnalyticsSection />
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Users ({profiles.length})</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profiles.map((profile) => (
                      <tr key={profile.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={profile.coverPhoto || profile.photos[0] || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                              alt={profile.name}
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                              <div className="text-sm text-gray-500">{profile.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{profile.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            profile.role?.toLowerCase().includes('super_admin') || profile.role?.toLowerCase().includes('founder') || profile.role?.toLowerCase().includes('ceo')
                              ? 'bg-red-100 text-red-800'
                              : profile.role?.toLowerCase().includes('photographer')
                              ? 'bg-purple-100 text-purple-800'
                              : profile.role?.toLowerCase().includes('admin')
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {profile.role || 'User'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            profile.hasCompletedProfile 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {profile.hasCompletedProfile ? 'Complete' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <select
                            value={profile.role || 'User'}
                            onChange={(e) => handleUpdateUserRole(profile.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="User">User</option>
                            <option value="Photographer">Photographer</option>
                            <option value="Admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="Founder">Founder</option>
                            <option value="CEO">CEO</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleResendEmail(profile)}
                            className="text-purple-600 hover:text-purple-900 flex items-center space-x-1"
                            title="Resend invitation email"
                          >
                            <Send className="h-4 w-4" />
                            <span>Resend Invitation</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {profiles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No users found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Feedback Management</h2>
            </div>

            {/* Feedback Stats */}
            {feedbackStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                      <p className="text-3xl font-bold text-gray-900">{feedbackStats.totalTickets}</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                      <p className="text-3xl font-bold text-gray-900">{feedbackStats.openTickets}</p>
                    </div>
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Bug Reports</p>
                      <p className="text-3xl font-bold text-gray-900">{feedbackStats.bugCount}</p>
                    </div>
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Resolution (hrs)</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {feedbackStats.avgResolutionTimeHours ? Math.round(feedbackStats.avgResolutionTimeHours) : 0}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Tickets Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Tickets</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchAllTickets({ status: 'open' })}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => fetchAllTickets()}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      All
                    </button>
                  </div>
                </div>

                {loadingFeedback ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <p className="mt-2 text-gray-500">Loading tickets...</p>
                  </div>
                ) : allTickets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No feedback tickets yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allTickets.map((ticket) => (
                          <tr key={ticket.id}>
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {ticket.title}
                                </div>
                                <div className="text-sm text-gray-500 truncate">
                                  {ticket.description.substring(0, 80)}...
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                ticket.type === 'bug' 
                                  ? 'bg-red-100 text-red-800'
                                  : ticket.type === 'feature'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {ticket.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                ticket.priority === 'critical' 
                                  ? 'bg-red-100 text-red-800'
                                  : ticket.priority === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : ticket.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                value={ticket.status}
                                onChange={(e) => updateTicketStatus(ticket.id, e.target.value as any)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ticket.user?.name || ticket.user?.email || ticket.contactEmail || 'Unknown User'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  const notes = prompt('Add admin notes:', ticket.adminNotes || '');
                                  if (notes !== null) {
                                    addAdminNotes(ticket.id, notes);
                                  }
                                }}
                                className="text-purple-600 hover:text-purple-900 mr-3"
                              >
                                Notes
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Photo Management</h2>
              <div className="flex space-x-2">
                <select className="px-3 py-2 text-sm border border-gray-300 rounded-md">
                  <option value="">All Events</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
                <select className="px-3 py-2 text-sm border border-gray-300 rounded-md">
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            {/* Photo Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Photos</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {profiles.reduce((total, profile) => total + (profile.photos?.length || 0), 0)}
                    </p>
                  </div>
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recent Uploads</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {profiles.filter(p => {
                        const profileDate = new Date(p.createdAt);
                        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        return profileDate > oneDayAgo && p.photos?.length > 0;
                      }).reduce((total, profile) => total + (profile.photos?.length || 0), 0)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Events with Photos</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {events.filter(event => 
                        profiles.some(profile => profile.eventId === event.id && profile.photos?.length > 0)
                      ).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-teal-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Upload Sessions</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {new Set(profiles.filter(p => p.photos?.length > 0).map(p => p.createdAt.split('T')[0])).size}
                    </p>
                  </div>
                  <Upload className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Photos by Event */}
            <div className="space-y-6">
              {events.map((event) => {
                const eventProfiles = profiles.filter(p => p.eventId === event.id && p.photos?.length > 0);
                if (eventProfiles.length === 0) return null;

                const totalPhotos = eventProfiles.reduce((total, profile) => total + (profile.photos?.length || 0), 0);
                
                // Group profiles by upload date (batch)
                const photosByDate = eventProfiles.reduce((acc, profile) => {
                  const uploadDate = new Date(profile.createdAt).toLocaleDateString();
                  if (!acc[uploadDate]) {
                    acc[uploadDate] = [];
                  }
                  acc[uploadDate].push(profile);
                  return acc;
                }, {} as Record<string, typeof eventProfiles>);

                return (
                  <div key={event.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                          <p className="text-sm text-gray-600">
                            {event.location} • {new Date(event.date).toLocaleDateString()} • {totalPhotos} photos from {eventProfiles.length} participants
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={async () => {
                              // Find profiles that need invitation emails resent
                              const profilesToEmail = eventProfiles.filter(p => !p.hasCompletedProfile);
                              if (profilesToEmail.length === 0) {
                                alert('All participants have completed their profiles.');
                                return;
                              }
                              
                              if (confirm(`Resend invitation emails to ${profilesToEmail.length} participants who haven't completed their profiles?`)) {
                                let successCount = 0;
                                let errorCount = 0;
                                
                                for (const profile of profilesToEmail) {
                                  try {
                                    await sendProfileInvitationEmail(
                                      profile.email,
                                      profile.name || profile.email.split('@')[0] || 'Participant',
                                      event.name,
                                      profile.id,
                                      event.id
                                    );
                                    successCount++;
                                  } catch (error) {
                                    console.error(`Failed to send email to ${profile.email}:`, error);
                                    errorCount++;
                                  }
                                }
                                
                                if (errorCount === 0) {
                                  alert(`✅ Successfully sent ${successCount} invitation emails!`);
                                } else {
                                  alert(`Sent ${successCount} emails successfully, ${errorCount} failed. Check console for details.`);
                                }
                              }
                            }}
                            className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Send className="h-4 w-4" />
                            <span>Resend Invitations</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Upload Batches */}
                      {Object.entries(photosByDate).map(([date, batchProfiles]) => {
                        const batchPhotos = batchProfiles.reduce((total, profile) => total + (profile.photos?.length || 0), 0);
                        
                        return (
                          <div key={date} className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-md font-medium text-gray-900">
                                Upload Batch - {date}
                              </h4>
                              <span className="text-sm text-gray-600">
                                {batchPhotos} photos from {batchProfiles.length} participants
                              </span>
                            </div>
                            
                            {/* Participants in this batch */}
                            <div className="space-y-4">
                              {batchProfiles.map((profile) => (
                                <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      <img
                                        className="h-8 w-8 rounded-full object-cover"
                                        src={profile.coverPhoto || profile.photos?.[0] || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800'}
                                        alt={profile.name}
                                      />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                                        <p className="text-xs text-gray-500">{profile.email} • {profile.role}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        profile.hasCompletedProfile 
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {profile.hasCompletedProfile ? 'Complete' : 'Pending'}
                                      </span>
                                      <span className="text-sm text-gray-600">{profile.photos?.length || 0} photos</span>
                                      {!profile.hasCompletedProfile && (
                                        <button
                                          onClick={() => handleResendEmail(profile)}
                                          className="text-purple-600 hover:text-purple-900 text-sm"
                                        >
                                          Resend Email
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Photo Grid */}
                                  {profile.photos && profile.photos.length > 0 && (
                                    <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                                      {profile.photos.slice(0, 12).map((photo, photoIndex) => (
                                        <img
                                          key={photoIndex}
                                          src={photo}
                                          alt={`${profile.name} photo ${photoIndex + 1}`}
                                          className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
                                          onClick={() => window.open(photo, '_blank')}
                                        />
                                      ))}
                                      {profile.photos.length > 12 && (
                                        <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center text-gray-600 text-xs">
                                          +{profile.photos.length - 12}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {events.filter(event => 
                profiles.some(profile => profile.eventId === event.id && profile.photos?.length > 0)
              ).length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No photos have been uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Event Edit Modal */}
      {editingEvent && (
        <CommunityEditModal
          event={editingEvent}
          isOpen={eventEditModalOpen}
          onClose={handleCloseEventModal}
          onSave={handleEventSaved}
          canEdit={canEditEvent(editingEvent)}
        />
      )}
    </div>
  );
};