import { useState, useEffect } from 'react';
import './ProfilePage.css';
import { apiFetch, showAlert, validateRequired } from '../../utils/api';

// ProfilePage Component - User profile management
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
  
  // User details state
  const [userEmail, setUserEmail] = useState('');
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Referral state
  const [referralCode, setReferralCode] = useState('');
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  // Stats state
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch user details on mount
  useEffect(() => {
    fetchUserDetails();
    fetchUserStats();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      // For guest users with temporary IDs, set defaults immediately
      if (!userId || userId.startsWith('guest_')) {
        console.log('Guest user detected, setting default values');
        setUserEmail('guest@temporary.com');
        setReferralCode('N/A');
        return;
      }

      const data = await apiFetch(`/users/${userId}`);
      console.log('User details received:', data);
      if (data.user) {
        setUserEmail(data.user.email || 'No email set');
        setReferralCode(data.user.referralCode || 'N/A');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Set defaults if fetch fails
      setUserEmail('No email set');
      setReferralCode('N/A');
    }
  };

  const fetchUserStats = async () => {
    setIsLoadingStats(true);
    try {
      // For guest users, set zero stats
      if (!userId || userId.startsWith('guest_')) {
        setGamesPlayed(0);
        setGamesWon(0);
        setIsLoadingStats(false);
        return;
      }

      // Fetch game statistics from API
      const data = await apiFetch(`/users/${userId}/stats`);
      if (data.stats) {
        setGamesPlayed(data.stats.gamesPlayed || 0);
        setGamesWon(data.stats.gamesWon || 0);
      } else {
        setGamesPlayed(0);
        setGamesWon(0);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setGamesPlayed(0);
      setGamesWon(0);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if guest user
    if (!userId || userId.startsWith('guest_')) {
      showAlert('Guest users cannot request subscription. Please create a permanent account first.', 'error');
      return;
    }
    
    const validationError = validateRequired({ message: subscriptionMessage.trim() });
    if (validationError) {
      showAlert('Please enter a message for your subscription request', 'error');
      return;
    }

    setIsSubmittingSubscription(true);
    
    try {
      const response = await apiFetch('/subscription/request', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          username,
          message: subscriptionMessage,
        }),
      });

      console.log('Subscription request response:', response);
      showAlert('Subscription request submitted successfully! Admin will review it soon.', 'success');
      setShowSubscriptionForm(false);
      setSubscriptionMessage('');
      // Don't update subscription status - only admin approval should do this
    } catch (error: any) {
      console.error('Subscription request error:', error);
      showAlert(error.message || 'Failed to submit subscription request. Please try again.', 'error');
    } finally {
      setIsSubmittingSubscription(false);
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
      await apiFetch('/users/change-password', {
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

  const copyReferralCode = () => {
    if (!referralCode || referralCode === 'N/A') {
      showAlert('Referral code not available for guest users. Please create a permanent account.', 'error');
      return;
    }
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      showAlert('Referral code copied to clipboard!', 'success');
    }
  };

  const shareReferralCode = () => {
    if (!referralCode || referralCode === 'N/A') {
      showAlert('Referral code not available for guest users. Please create a permanent account.', 'error');
      return;
    }
    
    const referralLink = `${window.location.origin}/?ref=${referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: '🎰 Join Teen Patti!',
        text: `Join me on Teen Patti! Use my referral code: ${referralCode}. Get bonus coins on your first 3 deposits: 5%, 2%, 1%!`,
        url: referralLink,
      }).catch((error) => {
        console.error('Error sharing:', error);
        // Fallback to copy
        navigator.clipboard.writeText(referralLink);
        showAlert('Referral link copied to clipboard!', 'success');
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(referralLink);
      showAlert('Referral link copied to clipboard!', 'success');
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
            {isSubscribed && (
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
              <span className="detail-label">Account Status:</span>
              <span className="detail-value">
                {isSubscribed ? '⭐ Premium' : '🆓 Standard'}
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
            <div className="stat-value">{isLoadingStats ? '...' : gamesPlayed}</div>
            <div className="stat-label">Games Played</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{isLoadingStats ? '...' : gamesWon}</div>
            <div className="stat-label">Games Won</div>
          </div>
        </div>

        {/* Account Management Section */}
        <div className="account-management-section">
          <h3 className="section-title">🔐 Account Security</h3>
          <div className="management-buttons">
            <button 
              className="management-btn"
              onClick={() => setShowPasswordForm(true)}
            >
              <span className="btn-icon">🔒</span>
              <span className="btn-text">Change Password</span>
            </button>
          </div>
        </div>

        {/* Referral Section */}
        <div className="referral-section">
          <h3 className="section-title">🎁 Refer & Earn</h3>
          <p className="referral-subtitle">Invite friends and earn bonus coins on their deposits!</p>
          <div className="referral-card">
            <div className="referral-code-container">
              <label className="referral-label">Your Referral Code</label>
              <div className="referral-code-display">
                <span className="referral-code">{referralCode || 'Loading...'}</span>
                <button 
                  className="copy-btn"
                  onClick={copyReferralCode}
                  disabled={!referralCode || referralCode === 'N/A'}
                  title={referralCode === 'N/A' ? 'Not available for guests' : 'Copy code'}
                >
                  📋
                </button>
              </div>
            </div>
            <div className="referral-actions">
              <button 
                className="referral-btn primary"
                onClick={shareReferralCode}
                disabled={!referralCode || referralCode === 'N/A'}
              >
                <span className="btn-icon">📤</span>
                <span className="btn-text">Share Referral Link</span>
              </button>
              <button 
                className="referral-btn secondary"
                onClick={() => {
                  if (!referralCode || referralCode === 'N/A') {
                    showAlert('Referral dashboard not available for guest users. Please create a permanent account.', 'error');
                    return;
                  }
                  setShowReferralModal(true);
                }}
                disabled={!referralCode || referralCode === 'N/A'}
              >
                <span className="btn-icon">📊</span>
                <span className="btn-text">View Dashboard</span>
              </button>
            </div>
            <div className="referral-bonus-info">
              <p className="bonus-title">💰 Bonus Structure:</p>
              <ul className="bonus-list">
                <li>1st deposit: <strong>5%</strong> bonus</li>
                <li>2nd deposit: <strong>2%</strong> bonus</li>
                <li>3rd deposit: <strong>1%</strong> bonus</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Subscription Action - Only show if not subscribed */}
        {!isSubscribed && (
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

      {/* Referral Dashboard Modal */}
      {showReferralModal && (
        <div className="modal-overlay" onClick={() => setShowReferralModal(false)}>
          <div className="referral-dashboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Referral Dashboard</h3>
              <button className="btn-close" onClick={() => setShowReferralModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                Your complete referral statistics and earnings are available in the Referral Dashboard.
                Navigate there from the main menu to see:
              </p>
              <ul className="dashboard-features">
                <li>📈 Total friends referred</li>
                <li>💰 Total earnings from referrals</li>
                <li>👥 List of all referred users</li>
                <li>📊 Deposit history of referred users</li>
                <li>🎁 Detailed bonus breakdown</li>
              </ul>
              <div className="modal-actions">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setShowReferralModal(false);
                    // Navigate to referral dashboard - you may need to add navigation logic
                    window.location.hash = '#referrals';
                  }}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
