import { useState } from 'react';
import './SettingsPage.css';
import { apiFetch, showAlert } from '../../utils/api';

interface SettingsPageProps {
  username: string;
  userId: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ username, userId }) => {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim() || !currentPassword.trim()) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showAlert('Please enter a valid email address', 'error');
      return;
    }

    setIsSubmittingEmail(true);
    
    try {
      await apiFetch('/user/change-email', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          newEmail,
          currentPassword,
        }),
      });

      showAlert('Email updated successfully!', 'success');
      setCurrentEmail(newEmail);
      setNewEmail('');
      setCurrentPassword('');
    } catch (error: any) {
      showAlert(error.message || 'Failed to update email. Please check your password and try again.', 'error');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Password must be at least 6 characters long', 'error');
      return;
    }

    setIsSubmittingPassword(true);
    
    try {
      await apiFetch('/user/change-password', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      showAlert('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showAlert(error.message || 'Failed to update password. Please check your current password and try again.', 'error');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <p>Manage your account settings</p>
      </div>
      
      <div className="settings-content">
        {/* Account Info Card */}
        <div className="settings-card">
          <div className="card-header">
            <h2>👤 Account Information</h2>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Username:</span>
              <span className="info-value">{username}</span>
            </div>
            <div className="info-row">
              <span className="info-label">User ID:</span>
              <span className="info-value">{userId.substring(0, 8)}...</span>
            </div>
            {currentEmail && (
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{currentEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Change Email Card */}
        <div className="settings-card">
          <div className="card-header">
            <h2>📧 Change Email</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleEmailChange} className="settings-form">
              <div className="form-group">
                <label htmlFor="newEmail">New Email Address</label>
                <input
                  type="email"
                  id="newEmail"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isSubmittingEmail}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="emailPassword">Current Password</label>
                <input
                  type="password"
                  id="emailPassword"
                  placeholder="Confirm with your password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSubmittingEmail}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-submit"
                disabled={isSubmittingEmail}
              >
                {isSubmittingEmail ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="settings-card">
          <div className="card-header">
            <h2>🔒 Change Password</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handlePasswordChange} className="settings-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSubmittingPassword}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmittingPassword}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmittingPassword}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-submit"
                disabled={isSubmittingPassword}
              >
                {isSubmittingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
