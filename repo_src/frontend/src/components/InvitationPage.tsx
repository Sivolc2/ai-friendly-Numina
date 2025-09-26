import React from 'react';
import { Mail, Users } from 'lucide-react';

interface InvitationPageProps {
  invitationCode: string;
  onAcceptComplete: (eventId: string, organizationId: string) => void;
}

export const InvitationPage: React.FC<InvitationPageProps> = ({
  invitationCode,
  onAcceptComplete
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <Mail className="h-16 w-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">You're Invited!</h1>
          <p className="text-gray-600 mb-6">
            You've been invited to join a community. Accept the invitation to get started.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Invitation code: {invitationCode}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => onAcceptComplete('demo-event', 'demo-org')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Users className="h-5 w-5" />
              <span>Accept Invitation</span>
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};