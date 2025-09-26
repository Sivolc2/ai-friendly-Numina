import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, Bug, Lightbulb, MessageSquare, Camera, UserPlus } from 'lucide-react';
import { useFeedback } from '../hooks/useFeedback';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'bug' | 'feature' | 'feedback' | 'member';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, initialType = 'feedback' }) => {
  const [type, setType] = useState<'bug' | 'feature' | 'feedback' | 'member'>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { submitFeedback, error } = useFeedback();
  const { user } = useAuth();

  const resetForm = () => {
    setType(initialType);
    setTitle('');
    setDescription('');
    setContactEmail('');
    setAttachments([]);
    setSuccess(false);
    setValidationError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    // Limit to 3 files and 5MB each
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024).slice(0, 3);
    setAttachments(prev => [...prev, ...validFiles].slice(0, 3));
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationError('');
    
    // Validate required fields
    if (!title.trim()) {
      setValidationError('Please provide a title for your feedback.');
      return;
    }
    
    if (!description.trim()) {
      setValidationError('Please provide a description of your feedback.');
      return;
    }
    
    // For non-authenticated users, require email
    if (!user && !contactEmail.trim()) {
      setValidationError('Please provide your email address so we can contact you.');
      return;
    }
    
    // Validate email format for non-authenticated users
    if (!user && contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail.trim())) {
        setValidationError('Please provide a valid email address.');
        return;
      }
    }

    setSubmitting(true);
    let success = false;

    try {
      // For now, we'll skip file uploads and just submit text
      // In a real implementation, you'd upload files to Supabase storage first
      const attachmentUrls: string[] = [];
      
      success = await submitFeedback({
        type,
        title,
        description,
        contactEmail: !user ? contactEmail.trim() : undefined,
        attachmentUrls,
        userAgent: navigator.userAgent,
        pageUrl: window.location.href
      });

      if (success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Error in feedback submission:', err);
      success = false;
    } finally {
      // Always set submitting to false after the operation completes
      if (!success) {
        setSubmitting(false);
      }
    }
  };

  const typeOptions = [
    {
      value: 'bug' as const,
      label: 'Bug Report',
      description: 'Something is broken or not working as expected',
      icon: Bug,
      color: 'text-red-600 bg-red-50 border-red-200'
    },
    {
      value: 'feature' as const,
      label: 'Feature Request',
      description: 'Suggest a new feature or improvement',
      icon: Lightbulb,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      value: 'feedback' as const,
      label: 'General Feedback',
      description: 'Share your thoughts or general feedback',
      icon: MessageSquare,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      value: 'member' as const,
      label: 'Join Numina',
      description: 'Request to become a member of the platform',
      icon: UserPlus,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Share Your Feedback</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="text-green-800 font-medium">Thank you for your feedback!</h3>
                <p className="text-green-600 text-sm">We've received your submission and will review it soon.</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What type of feedback is this?
              </label>
              <div className="grid grid-cols-1 gap-3">
                {typeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        type === option.value
                          ? option.color
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={option.value}
                        checked={type === option.value}
                        onChange={(e) => setType(e.target.value as typeof type)}
                        className="sr-only"
                      />
                      <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your feedback"
                required
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>

            {/* Email for non-authenticated users */}
            {!user && (
              <div className="mb-4">
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email Address *
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll use this email to contact you about your {type === 'member' ? 'membership request' : 'feedback'}.
                </p>
              </div>
            )}

            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'bug'
                    ? 'Please describe what happened, what you expected to happen, and steps to reproduce the issue...'
                    : type === 'feature'
                    ? 'Please describe the feature you\'d like to see and how it would help you...'
                    : 'Please share your thoughts, suggestions, or any other feedback...'
                }
                required
                disabled={submitting}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 resize-none"
              />
            </div>

            {/* Attachments */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Screenshots or Files (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting || attachments.length >= 3}
                  className="w-full flex items-center justify-center py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Choose files (max 3, 5MB each)
                </button>
              </div>
              
              {attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              </div>
            )}
            
            {/* Validation Error Message */}
            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 text-sm">{validationError}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !description.trim() || (!user && !contactEmail.trim()) || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};