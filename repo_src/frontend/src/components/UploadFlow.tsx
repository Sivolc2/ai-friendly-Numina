import React, { useState } from 'react';
import { ArrowLeft, Upload, Plus, X, Mail, User, Tag, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import { supabase } from '../lib/supabase';

interface UploadFlowProps {
  onBack: () => void;
  fetchProfiles: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  allAvailableTags: string[];
  events: Event[];
}

interface Participant {
  email: string;
  role: string;
  photoIndexes: number[];
}

interface UploadProgress {
  total: number;
  current: number;
  currentTask: string;
  participantEmail?: string;
  photoIndex?: number;
}

interface FailedUpload {
  participantEmail: string;
  photoIndex: number;
  error: string;
  retryCount: number;
}

export const UploadFlow: React.FC<UploadFlowProps> = ({ onBack, fetchProfiles, fetchEvents, allAvailableTags, events }) => {
  const [currentStep, setCurrentStep] = useState<'event' | 'photos' | 'participants' | 'review'>('event');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);
  const [emailErrors, setEmailErrors] = useState<{ email: string; error: string }[]>([]);
  
  const [eventSelectionMode, setEventSelectionMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingEventId, setSelectedExistingEventId] = useState<string>('');
  
  // Common role suggestions for fast selection
  const commonRoles = [
    'Founder', 'Co-Founder', 'CEO', 'CTO', 'Designer', 'Developer', 
    'Engineer', 'Product Manager', 'Marketing Manager', 'Sales Manager',
    'Entrepreneur', 'Consultant', 'Freelancer', 'Artist', 'Photographer',
    'Writer', 'Content Creator', 'Data Scientist', 'UX Designer', 'UI Designer'
  ];
  
  const [eventData, setEventData] = useState({
    name: '',
    location: '',
    date: '',
    description: '',
    tags: [] as string[],
    isPrivate: false,
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newTag, setNewTag] = useState('');
  
  const { createEvent, createProfile, uploadImage, sendProfileInvitationEmail } = useData();
  const { user } = useAuth();

  // Get selected existing event details
  const selectedExistingEvent = events.find(event => event.id === selectedExistingEventId);

  // Handle event selection mode change
  const handleEventSelectionModeChange = (mode: 'new' | 'existing') => {
    setEventSelectionMode(mode);
    if (mode === 'existing') {
      // Clear new event data when switching to existing
      setEventData({
        name: '',
        location: '',
        date: '',
        description: '',
        tags: [],
        isPrivate: false,
      });
    } else {
      // Clear selected existing event when switching to new
      setSelectedExistingEventId('');
    }
  };

  // Handle existing event selection
  const handleExistingEventSelection = (eventId: string) => {
    setSelectedExistingEventId(eventId);
    const event = events.find(e => e.id === eventId);
    if (event) {
      // Populate event data for display (read-only)
      setEventData({
        name: event.name,
        location: event.location,
        date: event.date,
        description: event.description,
        tags: event.tags,
        isPrivate: event.isPrivate,
      });
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newPhotos = Array.from(files).filter(file => file.type.startsWith('image/'));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const addParticipant = () => {
    console.log('=== ADD PARTICIPANT CLICKED ===');
    console.log('Current participants count:', participants.length);
    console.log('Photos available:', photos.length);
    console.log('User role - isPhotographer:', user?.email?.includes('photographer') || false);
    console.log('User role - isSuperAdmin:', user?.email === 'derrick@derricksiu.com' || user?.email === 'accounts@derricksiu.com' || false);
    
    const allPhotoIndexes = photos.map((_, index) => index);
    console.log('Photo indexes to assign:', allPhotoIndexes);
    
    try {
      setParticipants(prev => {
        const newParticipants = [...prev, { email: '', role: '', photoIndexes: allPhotoIndexes }];
        console.log('New participants array:', newParticipants);
        return newParticipants;
      });
      console.log('✅ Participant added successfully');
    } catch (error) {
      console.error('❌ Error adding participant:', error);
      alert('Failed to add participant. Please check console for details.');
    }
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string | number[] | boolean) => {
    setParticipants(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const removeParticipant = (index: number) => {
    setParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = (tag?: string) => {
    const tagToAdd = tag || newTag.trim();
    if (tagToAdd && !eventData.tags.includes(tagToAdd)) {
      setEventData(prev => ({
        ...prev,
        tags: [...prev.tags, tagToAdd].sort()
      }));
      if (!tag) setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEventData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const nextStep = () => {
    const steps = ['event', 'photos', 'participants', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    
    // Validation before moving to next step
    if (currentStep === 'participants') {
      const invalidParticipants = participants.filter(p => 
        !p.email || !p.role || p.photoIndexes.length === 0
      );
      
      if (invalidParticipants.length > 0) {
        const missingItems = invalidParticipants.map(p => {
          const missing = [];
          if (!p.email) missing.push('email');
          if (!p.role) missing.push('role');
          if (p.photoIndexes.length === 0) missing.push('photos');
          return `Participant ${participants.indexOf(p) + 1}: missing ${missing.join(', ')}`;
        });
        
        alert(`Please fix the following issues before continuing:\n\n${missingItems.join('\n')}`);
        return;
      }
    }
    
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1] as any);
    }
  };

  const prevStep = () => {
    const steps = ['event', 'photos', 'participants', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1] as any);
    }
  };

  const handleSubmit = async () => {
    console.log('=== UPLOAD FLOW SUBMIT STARTED ===');
    console.log('User authenticated:', !!user);
    console.log('Event mode:', eventSelectionMode);
    console.log('Photos to upload:', photos.length);
    console.log('Participants:', participants.length);
    
    if (!user) {
      alert('You must be logged in to upload');
      return;
    }

    // Test Supabase connectivity first
    try {
      console.log('Testing Supabase connectivity...');
      const { error: pingError } = await supabase.from('profiles').select('id').limit(1);
      if (pingError) {
        console.error('Supabase connectivity test failed:', pingError);
        alert('Cannot connect to the server. Please check your internet connection and try again.');
        return;
      }
      console.log('✅ Supabase connectivity test passed');
    } catch (connError) {
      console.error('Network error:', connError);
      alert('Network error. Please check your internet connection and try again.');
      return;
    }

    setLoading(true);
    try {
      let event;
      
      if (eventSelectionMode === 'new') {
        console.log('Creating new event...');
        // Create new event
        let eventCoverImage = '';
        if (photos.length > 0) {
          console.log('Uploading event cover image...');
          eventCoverImage = await uploadImage(photos[0], 'events');
          console.log('Event cover image uploaded:', eventCoverImage);
        }

        console.log('Creating event with data:', eventData);
        event = await createEvent({
          name: eventData.name,
          location: eventData.location,
          date: eventData.date,
          description: eventData.description,
          tags: eventData.tags,
          isPrivate: eventData.isPrivate,
          coverImage: eventCoverImage
        });
        console.log('Event created successfully:', event.id);
      } else {
        console.log('Using existing event:', selectedExistingEventId);
        // Use existing event
        event = selectedExistingEvent;
        if (!event) {
          throw new Error('No existing event selected');
        }
      }

      // Final validation before processing
      const validParticipants = participants.filter(p => p.email && p.role && p.photoIndexes.length > 0);
      const invalidParticipants = participants.filter(p => !p.email || !p.role || p.photoIndexes.length === 0);
      
      if (invalidParticipants.length > 0) {
        console.warn(`⚠️ Found ${invalidParticipants.length} invalid participants that will be skipped`);
      }
      
      if (validParticipants.length === 0) {
        alert('No valid participants found. Please ensure each participant has an email, role, and at least one photo assigned.');
        setLoading(false);
        return;
      }
      
      console.log(`Starting participant processing... (${validParticipants.length} valid, ${invalidParticipants.length} invalid)`);
      
      // Calculate total tasks for progress
      const totalPhotoCount = validParticipants.reduce((sum, p) => sum + p.photoIndexes.length, 0);
      const totalTasks = totalPhotoCount + validParticipants.length; // photos + profile creations
      let currentTaskCount = 0;
      
      // Upload photos and create profiles for each participant
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        console.log(`Processing participant ${i + 1}/${participants.length}:`, participant.email);
        
        if (participant.email && participant.role && participant.photoIndexes.length > 0) {
          console.log('Participant photos to upload:', participant.photoIndexes.length);
          
          // Update progress for this participant
          setUploadProgress({
            total: totalTasks,
            current: currentTaskCount,
            currentTask: `Uploading photos for ${participant.email}`,
            participantEmail: participant.email
          });
          
          // Upload the participant's photos with retry mechanism
          const uploadPhotoWithRetry = async (photoIndex: number, j: number, maxRetries: number = 3): Promise<string | null> => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              if (photos[photoIndex]) {
                try {
                  // Update progress for individual photo
                  setUploadProgress({
                    total: totalTasks,
                    current: currentTaskCount,
                    currentTask: `Uploading photo ${j + 1}/${participant.photoIndexes.length}${attempt > 1 ? ` (retry ${attempt}/${maxRetries})` : ''}`,
                    participantEmail: participant.email,
                    photoIndex: j + 1
                  });
                  
                  const photoUrl = await uploadImage(photos[photoIndex], 'profiles');
                  console.log(`Photo ${j + 1} uploaded successfully:`, photoUrl);
                  currentTaskCount++;
                  return photoUrl;
                } catch (photoError) {
                  console.error(`Failed to upload photo ${j + 1} for ${participant.email} (attempt ${attempt}):`, photoError);
                  
                  if (attempt === maxRetries) {
                    // Record failed upload
                    setFailedUploads(prev => [...prev, {
                      participantEmail: participant.email,
                      photoIndex: j + 1,
                      error: photoError.message || 'Unknown error',
                      retryCount: attempt
                    }]);
                    return null; // Return null for failed uploads instead of throwing
                  }
                  
                  // Wait before retry (exponential backoff)
                  await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
                }
              }
            }
            return null;
          };
          
          // Upload photos sequentially to avoid overwhelming the network/server
          const uploadedPhotos: string[] = [];
          for (let j = 0; j < participant.photoIndexes.length; j++) {
            const photoIndex = participant.photoIndexes[j];
            console.log(`Starting upload of photo ${j + 1}/${participant.photoIndexes.length} for ${participant.email} (index ${photoIndex})`);
            
            const uploadedUrl = await uploadPhotoWithRetry(photoIndex, j);
            if (uploadedUrl) {
              uploadedPhotos.push(uploadedUrl);
            }
          }
          console.log(`All ${uploadedPhotos.length} photos uploaded successfully for ${participant.email}`);

          // Create the profile
          // Profiles should NEVER be marked as completed until the user actually completes them
          // Admin uploads only create the initial profile with photos - the user must complete it
          
          const newProfile = await createProfile({
            id: crypto.randomUUID(), // Generate unique ID for each participant
            name: participant.email.split('@')[0] || 'Anonymous',
            email: participant.email,
            role: participant.role,
            story: `Participant from ${eventSelectionMode === 'existing' && selectedExistingEvent ? selectedExistingEvent.name : eventData.name}`,
            coverPhoto: uploadedPhotos[0] || '',
            photos: uploadedPhotos,
            socialLinks: {},
            tags: eventSelectionMode === 'existing' && selectedExistingEvent ? selectedExistingEvent.tags : eventData.tags,
            eventId: event.id,
            location: eventSelectionMode === 'existing' && selectedExistingEvent ? selectedExistingEvent.location : eventData.location,
            isPublic: false,  // Always start as private
            hasCompletedProfile: false,  // NEVER mark as completed on upload
            publishedProfile: false,  // Not published until user completes profile
            videoUrl: ''
          });

          // Send invitation email to participant
          console.log('Sending invitation email to:', participant.email);
          console.log('Profile created successfully');
          
          // Update progress for email sending
          setUploadProgress({
            total: totalTasks,
            current: currentTaskCount,
            currentTask: `Sending invitation email to ${participant.email}`,
            participantEmail: participant.email
          });
          
          try {
            await sendProfileInvitationEmail(
              participant.email,
              participant.email.split('@')[0] || 'Anonymous',
              eventSelectionMode === 'existing' && selectedExistingEvent 
                ? selectedExistingEvent.name 
                : eventData.name,
              newProfile.id,
              event.id,
              null // Token authentication removed
            );
            console.log(`✅ Invitation email sent successfully to ${participant.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send email to ${participant.email}:`, emailError);
            // Store failed email for reporting
            setEmailErrors(prev => [...prev, {
              email: participant.email,
              error: emailError.message || 'Unknown error'
            }]);
          }
          
          currentTaskCount++;
        } else {
          // Log why the participant was skipped
          const missing = [];
          if (!participant.email) missing.push('email');
          if (!participant.role) missing.push('role');
          if (participant.photoIndexes.length === 0) missing.push('photos');
          
          console.warn(`❌ Skipping participant ${i + 1} (${participant.email || 'no email'}): missing ${missing.join(', ')}`);
          console.warn('Participant data:', {
            email: participant.email,
            role: participant.role,
            photoCount: participant.photoIndexes.length,
            photoIndexes: participant.photoIndexes
          });
        }
      }

      // Refresh the data to show new uploads
      await Promise.all([fetchProfiles(), fetchEvents()]);

      // Clear upload progress
      setUploadProgress(null);

      // Prepare detailed success message
      let successMessage = eventSelectionMode === 'new' 
        ? `✅ Upload session created successfully!\n`
        : `✅ Photos and participants added to "${event.name}" successfully!\n`;
      
      successMessage += `\n📊 Upload Summary:\n`;
      successMessage += `• ${validParticipants.length} participant(s) processed\n`;
      successMessage += `• ${totalPhotoCount} photo(s) uploaded\n`;
      
      // Report failed uploads if any
      if (failedUploads.length > 0) {
        successMessage += `\n⚠️ Failed Uploads (${failedUploads.length}):\n`;
        failedUploads.forEach(fail => {
          successMessage += `• ${fail.participantEmail} - Photo ${fail.photoIndex}: ${fail.error}\n`;
        });
        successMessage += `\nNote: Profiles were created with successfully uploaded photos only.\n`;
      }
      
      // Report email failures if any
      if (emailErrors.length > 0) {
        successMessage += `\n⚠️ Email Errors (${emailErrors.length}):\n`;
        emailErrors.forEach(err => {
          successMessage += `• ${err.email}: ${err.error}\n`;
        });
        successMessage += `\nNote: Profiles were created but invitations weren't sent. You can resend from Admin Dashboard.\n`;
      } else if (validParticipants.length > 0) {
        successMessage += `\n✉️ All invitation emails sent successfully!\n`;
      }
      
      // Show skipped participants if any
      if (invalidParticipants.length > 0) {
        successMessage += `\n⏭️ Skipped ${invalidParticipants.length} incomplete participant(s)\n`;
      }
      
      alert(successMessage);
      
      // Reset error states
      setFailedUploads([]);
      setEmailErrors([]);
      
      onBack();
    } catch (error) {
      console.error('Error creating upload session:', error);
      alert(`Error creating upload session: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900">Upload Session</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {['event', 'photos', 'participants', 'review'].indexOf(currentStep) + 1} of 4
            </span>
            <span className="text-sm text-gray-500">
              {currentStep === 'event' && 'Event Details'}
              {currentStep === 'photos' && 'Photo Upload'}
              {currentStep === 'participants' && 'Participant Matching'}
              {currentStep === 'review' && 'Review & Submit'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((['event', 'photos', 'participants', 'review'].indexOf(currentStep) + 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Event Details Step */}
          {currentStep === 'event' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
              
              {/* Event Selection Mode */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Choose Event Option</h3>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="eventMode"
                      value="new"
                      checked={eventSelectionMode === 'new'}
                      onChange={() => handleEventSelectionModeChange('new')}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Create New Event</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="eventMode"
                      value="existing"
                      checked={eventSelectionMode === 'existing'}
                      onChange={() => handleEventSelectionModeChange('existing')}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Add to Existing Event</span>
                  </label>
                </div>
              </div>

              {/* Existing Event Selection */}
              {eventSelectionMode === 'existing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Existing Event *
                  </label>
                  <select
                    value={selectedExistingEventId}
                    onChange={(e) => handleExistingEventSelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Choose an event...</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} - {event.location} ({new Date(event.date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  
                  {selectedExistingEvent && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                        <h4 className="font-medium text-blue-900">Selected Event Details</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Name:</span>
                          <p className="text-blue-900">{selectedExistingEvent.name}</p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Location:</span>
                          <p className="text-blue-900">{selectedExistingEvent.location}</p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Date:</span>
                          <p className="text-blue-900">{new Date(selectedExistingEvent.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Privacy:</span>
                          <p className="text-blue-900">{selectedExistingEvent.isPrivate ? 'Private' : 'Public'}</p>
                        </div>
                      </div>
                      {selectedExistingEvent.tags.length > 0 && (
                        <div className="mt-3">
                          <span className="text-blue-700 font-medium text-sm">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedExistingEvent.tags.map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedExistingEvent.description && (
                        <div className="mt-3">
                          <span className="text-blue-700 font-medium text-sm">Description:</span>
                          <p className="text-blue-900 text-sm mt-1">{selectedExistingEvent.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* New Event Form */}
              {eventSelectionMode === 'new' && (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={eventData.name}
                    onChange={(e) => setEventData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Tech Startup Meetup"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={eventData.location}
                      onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={eventData.date}
                      onChange={(e) => setEventData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Privacy Setting
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={eventData.isPrivate}
                      onChange={(e) => setEventData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600">Make this event private</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe the event..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                
                {/* Currently selected tags */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {eventData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-purple-500 hover:text-purple-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                {/* Add new tag input */}
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Add a tag..."
                  />
                  <button
                    onClick={() => addTag()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Available tags from previous events */}
                {allAvailableTags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Quick add from previous events:</p>
                    <div className="flex flex-wrap gap-2">
                      {allAvailableTags
                        .filter(tag => !eventData.tags.includes(tag))
                        .map((tag) => (
                          <button
                            key={tag}
                            onClick={() => addTag(tag)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          )}

          {/* Photo Upload Step */}
          {currentStep === 'photos' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Upload Photos</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag and drop photos here, or click to select
                </p>
                <p className="text-gray-600 mb-4">Support for JPG, PNG files up to 10MB each</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Photos
                </label>
              </div>
              
              {photos.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">
                    Uploaded Photos ({photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-[3/4] rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Participants Step */}
          {currentStep === 'participants' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Match Participants</h2>
                <button
                  onClick={addParticipant}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Participant</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {participants.map((participant, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">Participant {index + 1}</h3>
                        {(!participant.email || !participant.role || participant.photoIndexes.length === 0) && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            Incomplete
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeParticipant(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            value={participant.email}
                            onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="participant@example.com"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={participant.role}
                            onChange={(e) => updateParticipant(index, 'role', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Founder, Designer, etc."
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Fast select role options */}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick select common roles:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {commonRoles.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => updateParticipant(index, 'role', role)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                              participant.role === role
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Photo Assignment Section - Enhanced */}
                    <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-lg font-bold text-blue-900">
                          📸 Assign Photos {participant.photoIndexes.length === 0 && (
                            <span className="text-red-600 font-normal text-sm">- Please select at least one photo</span>
                          )}
                        </label>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const allPhotoIndexes = photos.map((_, photoIndex) => photoIndex);
                              updateParticipant(index, 'photoIndexes', allPhotoIndexes);
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors font-medium"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateParticipant(index, 'photoIndexes', []);
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors font-medium"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>
                      {participant.photoIndexes.length > 0 && (
                        <p className="text-sm text-green-700 mb-3 font-medium bg-green-100 px-3 py-2 rounded-md">
                          ✓ {participant.photoIndexes.length} photo{participant.photoIndexes.length !== 1 ? 's' : ''} selected
                        </p>
                      )}
                      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {photos.map((photo, photoIndex) => (
                          <button
                            key={photoIndex}
                            onClick={() => {
                              const isSelected = participant.photoIndexes.includes(photoIndex);
                              const newIndexes = isSelected
                                ? participant.photoIndexes.filter(i => i !== photoIndex)
                                : [...participant.photoIndexes, photoIndex];
                              updateParticipant(index, 'photoIndexes', newIndexes);
                            }}
                            className={`relative group border-2 rounded-lg overflow-hidden aspect-[3/4] ${
                              participant.photoIndexes.includes(photoIndex)
                                ? 'border-purple-600 ring-2 ring-purple-300'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-sm font-medium">#{photoIndex + 1}</span>
                            </div>
                            {participant.photoIndexes.includes(photoIndex) && (
                              <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg">
                                ✓
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {participants.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No participants added yet. Click "Add Participant" to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
              
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Event Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">
                        {eventSelectionMode === 'existing' && selectedExistingEvent 
                          ? selectedExistingEvent.name 
                          : eventData.name || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <p className="font-medium">
                        {eventSelectionMode === 'existing' && selectedExistingEvent 
                          ? selectedExistingEvent.location 
                          : eventData.location || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">
                        {eventSelectionMode === 'existing' && selectedExistingEvent 
                          ? new Date(selectedExistingEvent.date).toLocaleDateString()
                          : eventData.date || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Privacy:</span>
                      <p className="font-medium">
                        {eventSelectionMode === 'existing' && selectedExistingEvent 
                          ? (selectedExistingEvent.isPrivate ? 'Private' : 'Public')
                          : (eventData.isPrivate ? 'Private' : 'Public')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Mode:</span>
                      <p className="font-medium">
                        {eventSelectionMode === 'existing' ? 'Adding to Existing Event' : 'Creating New Event'}
                      </p>
                    </div>
                  </div>
                  {((eventSelectionMode === 'existing' && selectedExistingEvent?.tags.length) || 
                    (eventSelectionMode === 'new' && eventData.tags.length)) > 0 && (
                    <div className="mt-3">
                      <span className="text-gray-600 text-sm">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(eventSelectionMode === 'existing' && selectedExistingEvent 
                          ? selectedExistingEvent.tags 
                          : eventData.tags).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Photos ({photos.length})</h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {photos.slice(0, 12).map((photo, index) => (
                      <div key={index} className="aspect-[3/4] rounded overflow-hidden">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {photos.length > 12 && (
                      <div className="aspect-[3/4] bg-gray-200 rounded flex items-center justify-center text-gray-600 text-xs">
                        +{photos.length - 12} more
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Participants ({participants.length})</h3>
                  <div className="space-y-2">
                    {participants.map((participant, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{participant.email}</span>
                          <span className="text-gray-600 ml-2">({participant.role})</span>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-500">
                            {participant.photoIndexes.length} photos assigned
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 'event'}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentStep === 'event'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>
            
            {currentStep === 'review' ? (
              <div className="flex items-center space-x-4">
                {uploadProgress && loading && (
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">
                      {uploadProgress.currentTask}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {uploadProgress.current} of {uploadProgress.total} tasks completed
                    </div>
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading 
                    ? (eventSelectionMode === 'existing' ? 'Adding to Event...' : 'Creating Session...') 
                    : (eventSelectionMode === 'existing' ? 'Add to Existing Event' : 'Submit Upload Session')}
                </button>
              </div>
            ) : (
              <button
                onClick={nextStep}
                disabled={eventSelectionMode === 'existing' && !selectedExistingEventId}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};