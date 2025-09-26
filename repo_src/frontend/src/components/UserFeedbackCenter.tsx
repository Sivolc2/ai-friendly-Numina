import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bug, Lightbulb, MessageSquare, UserPlus, AlertCircle, Clock, CheckCircle, Settings, MessageCircleIcon } from 'lucide-react';
import { useFeedback } from '../hooks/useFeedback';
import { useAuth } from '../contexts/AuthContext';
import { FeedbackTicket } from '../types';

interface UserFeedbackCenterProps {
  onBack: () => void;
}

export const UserFeedbackCenter: React.FC<UserFeedbackCenterProps> = ({ onBack }) => {
  const { tickets, loading, error, refreshTickets } = useFeedback();
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);

  useEffect(() => {
    if (user) {
      refreshTickets();
    }
  }, [user, refreshTickets]);

  const getTypeIcon = (type: FeedbackTicket['type']) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-5 h-5 text-red-600" />;
      case 'feature':
        return <Lightbulb className="w-5 h-5 text-blue-600" />;
      case 'member':
        return <UserPlus className="w-5 h-5 text-purple-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-green-600" />;
    }
  };

  const getStatusIcon = (status: FeedbackTicket['status']) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Settings className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-orange-600" />;
    }
  };

  const getStatusLabel = (status: FeedbackTicket['status']) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: FeedbackTicket['type']) => {
    switch (type) {
      case 'bug':
        return 'Bug Report';
      case 'feature':
        return 'Feature Request';
      case 'member':
        return 'Membership Request';
      default:
        return 'General Feedback';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">Please sign in to view your feedback submissions.</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">My Feedback</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback submitted yet</h3>
          <p className="text-gray-600">When you submit feedback, it will appear here along with any responses from our team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tickets List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Submissions ({tickets.length})</h2>
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedTicket?.id === ticket.id ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(ticket.type)}
                    <span className="text-sm text-gray-600">{getTypeLabel(ticket.type)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(ticket.status)}
                    <span className="text-sm text-gray-600">{getStatusLabel(ticket.status)}</span>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{ticket.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                <div className="text-xs text-gray-500">
                  Submitted {formatDate(ticket.createdAt)}
                </div>
              </div>
            ))}
          </div>

          {/* Ticket Details */}
          <div className="lg:sticky lg:top-6">
            {selectedTicket ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(selectedTicket.type)}
                    <span className="text-sm text-gray-600">{getTypeLabel(selectedTicket.type)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(selectedTicket.status)}
                    <span className="text-sm font-medium">{getStatusLabel(selectedTicket.status)}</span>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-gray-900 mb-3">{selectedTicket.title}</h2>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTicket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      selectedTicket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedTicket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-600">{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                </div>

                {selectedTicket.resolvedAt && (
                  <div className="text-sm mt-2">
                    <span className="font-medium text-gray-700">Resolved:</span>
                    <span className="ml-2 text-gray-600">{formatDate(selectedTicket.resolvedAt)}</span>
                  </div>
                )}

                {selectedTicket.adminNotes && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Team Response</h3>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedTicket.adminNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <MessageCircleIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Select a feedback submission to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};