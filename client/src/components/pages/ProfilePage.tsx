import { useState } from 'react';
import './ProfilePage.css';

interface ProfilePageProps {
  username: string;
  coins: number;
  cashBalance: number;
  userId: string;
  isSubscribed: boolean;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ username, coins, cashBalance, userId, isSubscribed }) => {
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localIsSubscribed, setLocalIsSubscribed] = useState(isSubscribed);

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscriptionMessage.trim()) {
      alert('Please enter a message for your subscription request');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/subscription/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          userId,
          username,
          message: subscriptionMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Subscription request submitted successfully! Admin will review it soon.');
        setShowSubscriptionForm(false);
        setSubscriptionMessage('');
        setLocalIsSubscribed(true); // Optimistically update UI
      } else {
        alert(data.error || 'Failed to submit subscription request');
      }
    } catch (error) {
      console.error('Error submitting subscription:', error);
      alert('Failed to submit subscription request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p>View and manage your account</p>
      </div>
      
      <div className="profile-content">
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

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🪙</div>
            <div className="stat-value">{coins}</div>
            <div className="stat-label">Practice Coins</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">₹</div>
            <div className="stat-value">{cashBalance}</div>
            <div className="stat-label">Cash Balance</div>
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

        <div className="profile-actions">
          {!localIsSubscribed ? (
            <button 
              className="action-btn subscribe-btn" 
              onClick={() => setShowSubscriptionForm(true)}
            >
              <span>⭐</span> Subscribe Now
            </button>
          ) : (
            <button 
              className="action-btn subscribed-btn" 
              disabled
              style={{ cursor: 'not-allowed', opacity: 0.7 }}
            >
              <span>✓</span> Subscribed
            </button>
          )}
        </div>
      </div>

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
                    disabled={isSubmitting}
                  />
                </div>
                <div className="subscription-benefits">
                  <h4>✨ Premium Benefits:</h4>
                  <ul>
                    <li>🎰 Play with real money</li>
                    <li>� Win real cash prizes</li>
                  </ul>
                </div>
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowSubscriptionForm(false)}
                    disabled={isSubmitting}
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
