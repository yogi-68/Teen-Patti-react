import React, { useState, useRef } from 'react';
import './AvatarUpload.css';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string) => void;
  entityType: 'bot' | 'blueprint';
  entityId: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onAvatarChange,
  entityType,
  entityId,
}) => {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(currentAvatar || '');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://teen-patti-server.onrender.com/api';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('avatar', file);

      // Upload to server
      const response = await fetch(`${API_BASE_URL}/admin/bots/avatars/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      // Update preview
      setPreview(data.avatar_url);

      // Update entity with new avatar
      await updateEntityAvatar(data.avatar_url);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateAvatar = async () => {
    setError('');
    setGenerating(true);

    try {
      const seed = entityId + Date.now();
      const response = await fetch(
        `${API_BASE_URL}/admin/bots/avatars/generate?seed=${seed}`,
        {
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      // Update preview
      setPreview(data.avatar_url);

      // Update entity with new avatar
      await updateEntityAvatar(data.avatar_url);

    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate avatar');
    } finally {
      setGenerating(false);
    }
  };

  const updateEntityAvatar = async (avatarUrl: string) => {
    try {
      const endpoint = entityType === 'bot'
        ? `${API_BASE_URL}/admin/bots/instance/${entityId}/avatar`
        : `${API_BASE_URL}/admin/bots/blueprint/${entityId}/avatar`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar_url: avatarUrl }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update avatar');
      }

      // Notify parent component
      onAvatarChange(avatarUrl);

    } catch (err) {
      console.error('Update error:', err);
      throw err;
    }
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {preview ? (
          <img src={preview} alt="Avatar preview" />
        ) : (
          <div className="avatar-placeholder">
            <span>No Avatar</span>
          </div>
        )}
      </div>

      <div className="avatar-actions">
        <button
          className="btn-upload"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || generating}
        >
          {uploading ? (
            <>
              <span className="spinner"></span>
              Uploading...
            </>
          ) : (
            <>
              <span>📤</span>
              Upload Image
            </>
          )}
        </button>

        <button
          className="btn-generate"
          onClick={handleGenerateAvatar}
          disabled={uploading || generating}
        >
          {generating ? (
            <>
              <span className="spinner"></span>
              Generating...
            </>
          ) : (
            <>
              <span>🎲</span>
              Generate Random
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div className="avatar-error">
          <span>⚠️</span>
          {error}
        </div>
      )}

      <div className="avatar-info">
        <small>Supported: JPG, PNG, GIF, WebP (Max 5MB)</small>
      </div>
    </div>
  );
};

export default AvatarUpload;
