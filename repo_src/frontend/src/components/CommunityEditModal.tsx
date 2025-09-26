import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Calendar, MapPin, FileText, Eye, EyeOff, Loader } from 'lucide-react';
import { Community } from '../types';
import { useData } from '../hooks/useData';
import { supabase } from '../lib/supabase';

interface CommunityEditModalProps {
  community: Community;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCommunity: Community) => void;
  canEdit: boolean;
}

export const CommunityEditModal: React.FC<CommunityEditModalProps> = ({
  community,
  isOpen,
  onClose,
  onSave,
  canEdit
}) => {
  const [formData, setFormData] = useState({
    name: community.name,
    location: community.location,
    date: community.date,
    description: community.description,
    coverImage: community.coverImage,
    isPrivate: community.isPrivate,
    tags: community.tags.join(', ')
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  const { updateEvent, uploadImage } = useData();

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateImage = (file: File): string | null => {
    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return 'Image must be less than 2MB';
    }

    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      return 'Only JPG, PNG, and WebP images are supported';
    }

    return null;
  };

  const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (file: File) => {
    const validation = validateImage(file);
    if (validation) {
      alert(validation);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress('Validating image...');
      
      // Get image dimensions for aspect ratio check
      const dimensions = await getImageDimensions(file);
      const aspectRatio = dimensions.width / dimensions.height;
      
      // Warn if not close to 16:9 (1.78)
      if (Math.abs(aspectRatio - 1.78) > 0.2) {
        if (!confirm(`Image aspect ratio is ${aspectRatio.toFixed(2)}:1. For best results, use 16:9 (1.78:1) ratio. Continue anyway?`)) {
          return;
        }
      }

      setUploadProgress('Uploading banner...');
      const imageUrl = await uploadImage(file, 'communitys');
      
      setUploadProgress('Banner uploaded successfully!');
      setTimeout(() => setUploadProgress(''), 2000);
      
      handleInputChange('coverImage', imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadProgress('Upload failed - please try again');
      setTimeout(() => setUploadProgress(''), 3000);
      
      // Show user-friendly error message
      let errorMessage = 'Error uploading image. Please try again.';
      if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('failed after')) {
        errorMessage = 'Upload failed after multiple attempts. Please try again later.';
      }
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      handleInputChange('coverImage', urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const testSupabaseConnection = async () => {
    console.log('Testing Supabase connection...');
    try {
      // Test a simple query to check connectivity
      const { data, error } = await supabase.from('communitys').select('id').limit(1);
      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      console.log('Supabase connection test successful:', data);
      return true;
    } catch (error) {
      console.error('Supabase connection test error:', error);
      return false;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.prcommunityDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    
    try {
      setSaving(true);
      
      const updatedEventData = {
        ...community,
        name: formData.name,
        location: formData.location,
        date: formData.date,
        description: formData.description,
        coverImage: formData.coverImage,
        isPrivate: formData.isPrivate,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await updateEvent(community.id, updatedEventData);
      onSave(updatedEventData);
      onClose();
    } catch (error) {
      console.error('Error saving community:', error);
      alert('Error saving community. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {canEdit ? 'Edit Event' : 'View Event Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Banner Upload Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Event Banner
            </label>
            
            {/* Current Banner Preview */}
            {formData.coverImage && (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={formData.coverImage}
                  alt="Event banner"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white text-sm">
                  <p className="font-medium">Current Banner</p>
                </div>
              </div>
            )}

            {canEdit && (
              <>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragOver 
                      ? 'border-purple-400 bg-purple-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => { e.prcommunityDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="banner-upload"
                    disabled={uploading}
                  />
                  
                  {uploading ? (
                    <div className="space-y-2">
                      <Loader className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
                      <p className="text-sm text-gray-600">
                        {uploadProgress || 'Uploading banner...'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="text-sm text-gray-600">
                        <label htmlFor="banner-upload" className="cursor-pointer text-purple-600 hover:text-purple-700">
                          Click to upload
                        </label>
                        {' or drag and drop'}
                      </div>
                      <p className="text-xs text-gray-500">
                        Recommended: 1600x900px (16:9 ratio) • Max 2MB • JPG, PNG, WebP
                      </p>
                    </div>
                  )}
                </div>

                {/* Alternative: Direct URL Input */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Or enter image URL directly
                  </button>
                </div>

                {showUrlInput && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700">
                      Image URL
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/banner-image.jpg"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Use URL
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Enter a direct link to an image hosted elsewhere (useful if upload is failing)
                    </p>
                    
                    {/* Debug: Test connection button */}
                    <button
                      type="button"
                      onClick={testSupabaseConnection}
                      className="w-full mt-2 px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded border hover:bg-gray-200"
                    >
                      🔧 Test Supabase Connection (debug)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Event Name
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!canEdit}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter community name"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!canEdit}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter community location"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Event Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={!canEdit}
                rows={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter community description"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="e.g. Networking, Tech, Startup"
            />
          </div>

          {canEdit && (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleInputChange('isPrivate', !formData.isPrivate)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  formData.isPrivate
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-green-300 bg-green-50 text-green-700'
                }`}
              >
                {formData.isPrivate ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Private Event</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Public Event</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {saving && <Loader className="h-4 w-4 animate-spin" />}
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};