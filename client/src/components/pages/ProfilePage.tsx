import { useState, useEffect } from 'react';
import './ProfilePage.css';
import { apiFetch, showAlert, validateRequired } from '../../utils/api';

interface ProfilePageProps {
  username: string;
  practiceCoins: number;
  realCoins: number;
  userId: string;
  isSubscribed: boolean;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ username, practiceCoins, realCoins, userId, isSubscribed }) => {
  // Subscription state
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [isSubmittingSubscription, setIsSubmittingSubscription] = useState(false);
  const [localIsSubscribed, setLocalIsSubscribed] = useState(isSubscribed);
  
  // User details state
  const [userEmail, setUserEmail] = useState('');
  const [joinDate, setJoinDate] = useState('');
  
  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Fetch user details on mount
  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const data = await apiFetch(`/users/${userId}`);
      if (data.user) {
        setUserEmail(data.user.email || '');
        setJoinDate(data.user.createdAt || '');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateRequired({ message: subscriptionMessage.trim() });
    if (validationError) {
      showAlert('Please enter a message for your subscription request', 'error');
      return;
    }

    setIsSubmittingSubscription(true);
    
    try {
      await apiFetch('/subscription/request', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          username,
          message: subscriptionMessage,
        }),
      });

      showAlert('Subscription request submitted successfully! Admin will review it soon.', 'success');
      setShowSubscriptionForm(false);
      setSubscriptionMessage('');
      setLocalIsSubscribed(true); // Optimistically update UI
    } catch (error) {
      showAlert('Failed to submit subscription request. Please try again.', 'error');
    } finally {
      setIsSubmittingSubscription(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim() || !emailPassword.trim()) {
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
          currentPassword: emailPassword,
        }),
      });

      showAlert('Email updated successfully!', 'success');
      setUserEmail(newEmail); // Update local state
      setNewEmail('');
      setEmailPassword('');
      setShowEmailForm(false);
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
      setShowPasswordForm(false);
    } catch (error: any) {
      showAlert(error.message || 'Failed to update password. Please check your current password and try again.', 'error');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="profile-page">
      
      <div className="profile-content">
        {/* Profile Header Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <div className="profile-info">
            <h2>{username}</h2>
            <p className="user-id">ID: {userId.substring(0, 8)}...</p>
            {localIsSubscribed && (
              <span className="subscription-badge">⭐ Subscribed</span>
            )}
          </div>
        </div>

        {/* User Personal Details Section */}
        <div className="personal-details-section">
          <h3 className="section-title">📋 Personal Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Username:</span>
              <span className="detail-value">{username}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{userEmail || 'Loading...'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">
                {joinDate ? new Date(joinDate).toLocaleDateString() : 'Loading...'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Account Status:</span>
              <span className="detail-value">
                {localIsSubscribed ? '⭐ Premium' : '🆓 Standard'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🪙</div>
            <div className="stat-value">{practiceCoins}</div>
            <div className="stat-label">Practice Coins</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">₹</div>
            <div className="stat-value">{realCoins}</div>
            <div className="stat-label">Real Cash</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎮</div>
            <div className="stat-value">0</div>
            <div className="stat-label">Games Played</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">0</div>
            <div className="stat-label">Games Won</div>
          </div>
        </div>

        {/* Account Management Section */}
        <div className="account-management-section">
          <h3 className="section-title">🔐 Account Security</h3>
          <div className="management-buttons">
            <button 
              className="management-btn"
              onClick={() => setShowEmailForm(true)}
            >
              <span className="btn-icon">📧</span>
              <span className="btn-text">Change Email</span>
            </button>
            <button 
              className="management-btn"
              onClick={() => setShowPasswordForm(true)}
            >
              <span className="btn-icon">🔒</span>
              <span className="btn-text">Change Password</span>
            </button>
          </div>
        </div>

        {/* Subscription Action - Only show if not subscribed */}
        {!localIsSubscribed && (
          <div className="profile-actions">
            <button 
              className="action-btn subscribe-btn" 
              onClick={() => setShowSubscriptionForm(true)}
            >
              <span>⭐</span> Subscribe to Premium
            </button>
          </div>
        )}
      </div>

      {/* Email Change Modal */}
      {showEmailForm && (
        <div className="modal-overlay" onClick={() => setShowEmailForm(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📧 Change Email Address</h3>
              <button className="btn-close" onClick={() => setShowEmailForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEmailChange}>
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
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    disabled={isSubmittingEmail}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={isSubmittingEmail}
                  >
                    {isSubmittingEmail ? 'Updating...' : 'Update Email'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowEmailForm(false)}
                    disabled={isSubmittingEmail}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="modal-overlay" onClick={() => setShowPasswordForm(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔒 Change Password</h3>
              <button className="btn-close" onClick={() => setShowPasswordForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePasswordChange}>
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

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={isSubmittingPassword}
                  >
                    {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowPasswordForm(false)}
                    disabled={isSubmittingPassword}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Form Modal */}
      {showSubscriptionForm && (
        <div className="modal-overlay" onClick={() => setShowSubscriptionForm(false)}>
          <div className="subscription-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⭐ Subscribe to Premium</h3>
              <button className="btn-close" onClick={() => setShowSubscriptionForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubscriptionSubmit}>
                <div className="form-group">
                  <label htmlFor="message">Why do you want to subscribe?</label>
                  <textarea
                    id="message"
                    value={subscriptionMessage}
                    onChange={(e) => setSubscriptionMessage(e.target.value)}
                    placeholder="Tell us why you want to subscribe to premium features..."
                    rows={4}
                    required
                    disabled={isSubmittingSubscription}
                  />
                </div>
                <div className="subscription-benefits">
                  <h4>✨ Premium Benefits:</h4>
                  <ul>
                    <li>🎰 Play with real money</li>
                    <li>💰 Win real cash prizes</li>
                    <li>💳 Deposit & withdraw funds</li>
                    <li>⚡ Priority support</li>
                  </ul>
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={isSubmittingSubscription}
                  >
                    {isSubmittingSubscription ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowSubscriptionForm(false)}
                    disabled={isSubmittingSubscription}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
