import { useState } from 'react';
import './SettingsPage.css';
import { apiFetch, showAlert } from '../../utils/api';

interface SettingsPageProps {
  username: string;
  userId: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userId, username }) => {
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Forgot password state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  // Audio settings state
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(() => {
    const saved = localStorage.getItem('backgroundMusicEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEffectsEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  const handleMusicToggle = async () => {
    const newValue = !backgroundMusicEnabled;
    setBackgroundMusicEnabled(newValue);
    
    // Dynamically import SoundManager to avoid circular dependencies
    const SoundManager = (await import('../../utils/SoundManager')).default;
    SoundManager.setMusicEnabled(newValue);
    
    showAlert(
      newValue ? '🎵 Background music enabled' : '🔇 Background music disabled',
      'success'
    );
  };

  const handleSoundToggle = async () => {
    const newValue = !soundEffectsEnabled;
    setSoundEffectsEnabled(newValue);
    
    const SoundManager = (await import('../../utils/SoundManager')).default;
    SoundManager.setSoundEnabled(newValue);
    
    showAlert(
      newValue ? '🔊 Sound effects enabled' : '🔇 Sound effects disabled',
      'success'
    );
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Please fill in all password fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Password must be at least 6 characters', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiFetch('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      showAlert('Password updated successfully! 🎉', 'success');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showAlert(error.message || 'Failed to update password. Please check your current password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-content">
        
        {/* Account Security Section */}
        <div className="settings-section">
          <h2 className="section-title">🔐 Account Security</h2>
          
          <div className="security-card">
            <div className="security-option">
              <div className="option-info">
                <h3>🔒 Change Password</h3>
                <p>Update your account password</p>
              </div>
              <button 
                className="action-btn"
                onClick={() => setShowPasswordForm(true)}
              >
                Change
              </button>
            </div>

            <div className="security-option">
              <div className="option-info">
                <h3>🔑 Forgot Login Password</h3>
                <p>Can't remember your password? Request a reset</p>
              </div>
              <button 
                className="action-btn"
                onClick={() => setShowForgotPasswordModal(true)}
              >
                Request Reset
              </button>
            </div>
          </div>
        </div>

        {/* Audio Settings Section */}
        <div className="settings-section">
          <h2 className="section-title">🔊 Audio Settings</h2>
          
          <div className="settings-option">
            <div className="option-info">
              <h3>🎵 Background Music</h3>
              <p>Toggle background music on/off</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={backgroundMusicEnabled}
                onChange={handleMusicToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="settings-option">
            <div className="option-info">
              <h3>🔊 Sound Effects</h3>
              <p>Toggle button clicks and game sounds</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={soundEffectsEnabled}
                onChange={handleSoundToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="modal-overlay" onClick={() => setShowPasswordForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔒 Change Password</h3>
              <button className="btn-close" onClick={() => setShowPasswordForm(false)}>✕</button>
            </div>
            
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowPasswordForm(false)}
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowForgotPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔐 Forgot Password</h3>
              <button className="btn-close" onClick={() => setShowForgotPasswordModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <p className="forgot-password-info">
                Submit a password reset request. Your request will appear in the admin panel where an administrator will review and reset your password.
              </p>

              <div className="user-info-box">
                <p><strong>Username:</strong> {username}</p>
                <p><strong>User ID:</strong> {userId}</p>
              </div>

              <p className="forgot-password-note">
                📄 Your request will be visible in the Admin Password Reset panel.
              </p>

              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowForgotPasswordModal(false)}
                  disabled={forgotPasswordLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-submit"
                  onClick={async () => {
                    setForgotPasswordLoading(true);
                    try {
                      await apiFetch('/password-reset/request', {
                        method: 'POST',
                        body: JSON.stringify({ 
                          userIdentifier: username,
                          requestType: 'login'
                        })
                      });

                      showAlert('Password reset request submitted successfully! Admin will review your request.', 'success');
                      setShowForgotPasswordModal(false);
                    } catch (error: any) {
                      showAlert(error.message || 'Failed to submit request', 'error');
                    } finally {
                      setForgotPasswordLoading(false);
                    }
                  }}
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

