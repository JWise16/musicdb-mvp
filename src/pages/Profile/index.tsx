import React, { useState, useRef } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import Avatar from '../../components/common/Avatar';
import Sidebar from '../../components/layout/Sidebar';

export default function Profile() {
  const { profile, loading, updateProfileWithAvatar } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    role: profile?.role || ''
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Update form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        role: profile.role || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const success = await updateProfileWithAvatar(
        {
          full_name: formData.full_name,
          bio: formData.bio,
          role: formData.role
        },
        avatarFile || undefined
      );

      if (success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview('');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      role: profile?.role || ''
    });
    setAvatarFile(null);
    setAvatarPreview('');
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="rounded-3xl bg-white shadow-soft p-8 min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Content */}
          <div>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Avatar Section */}
              <div className="lg:col-span-1">
                <div className="text-center">
                  <div className="mb-4">
                    <Avatar 
                      src={avatarPreview || profile?.avatar_url} 
                      size="xl" 
                      fallback={profile?.full_name}
                    />
                  </div>
                  
                  {isEditing && (
                    <div className="space-y-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Change Photo
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Information */}
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-gray-900">{profile?.full_name || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a role</option>
                        <option value="venue_owner">Venue Owner</option>
                        <option value="promoter">Promoter</option>
                        <option value="artist_manager">Artist Manager</option>
                        <option value="event_coordinator">Event Coordinator</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {profile?.role ? profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    ) : (
                      <p className="text-gray-900">{profile?.bio || 'No bio provided'}</p>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <p className="text-gray-900">{profile?.user_id || 'Not available'}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 