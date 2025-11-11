import { useState, useEffect } from 'react';
import './ReferralDashboard.css';

interface ReferralStats {
  referralCode: string;
  totalReferred: number;
  totalEarnings: number;
  referredUsers: Array<{
    userId: string;
    username: string;
    deposits: number;
    bonusEarned: number;
    registeredAt: string;
  }>;
}

function ReferralDashboard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('Please log in to view referral stats');
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/referral/my-stats`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching referral stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load referral stats');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/register?ref=${stats.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const shareViaWhatsApp = () => {
    if (stats?.referralCode) {
      const message = `🎰 Join me on Teen Patti! Use my referral code ${stats.referralCode} and get bonus coins on your first deposits! ${window.location.origin}/register?ref=${stats.referralCode}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const shareViaTwitter = () => {
    if (stats?.referralCode) {
      const message = `🎰 Join me on Teen Patti! Use code ${stats.referralCode} for bonus coins!`;
      const url = `${window.location.origin}/register?ref=${stats.referralCode}`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="referral-dashboard">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="referral-dashboard">
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={fetchReferralStats} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="referral-dashboard">
      <div className="referral-header">
        <h2>🎁 Referral Program</h2>
        <p className="referral-subtitle">
          Invite friends and earn bonus coins on their deposits!
        </p>
      </div>

      {/* Referral Code Section */}
      <div className="referral-code-section">
        <h3>Your Referral Code</h3>
        <div className="code-display">
          <span className="code-text">{stats.referralCode}</span>
          <button 
            onClick={copyReferralCode} 
            className="btn-copy"
            title="Copy referral code"
          >
            {copySuccess ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        <button onClick={copyReferralLink} className="btn-copy-link">
          🔗 Copy Registration Link
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.totalReferred}</div>
          <div className="stat-label">Friends Referred</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">🪙 {stats.totalEarnings.toFixed(2)}</div>
          <div className="stat-label">Total Earnings</div>
        </div>
      </div>

      {/* Bonus Structure */}
      <div className="bonus-structure">
        <h3>How It Works</h3>
        <div className="bonus-tiers">
          <div className="bonus-tier">
            <span className="tier-number">1st</span>
            <span className="tier-label">Deposit</span>
            <span className="tier-bonus">5% Bonus</span>
          </div>
          <div className="bonus-tier">
            <span className="tier-number">2nd</span>
            <span className="tier-label">Deposit</span>
            <span className="tier-bonus">2% Bonus</span>
          </div>
          <div className="bonus-tier">
            <span className="tier-number">3rd</span>
            <span className="tier-label">Deposit</span>
            <span className="tier-bonus">1% Bonus</span>
          </div>
        </div>
        <p className="bonus-note">
          You earn these bonuses on your friend's first 3 deposits!
        </p>
      </div>

      {/* Share Buttons */}
      <div className="share-section">
        <h3>Share Your Code</h3>
        <div className="share-buttons">
          <button onClick={shareViaWhatsApp} className="btn-share whatsapp">
            <span className="share-icon">💬</span>
            WhatsApp
          </button>
          <button onClick={shareViaTwitter} className="btn-share twitter">
            <span className="share-icon">🐦</span>
            Twitter
          </button>
        </div>
      </div>

      {/* Referred Users List */}
      {stats.referredUsers.length > 0 && (
        <div className="referred-users-section">
          <h3>Your Referrals ({stats.referredUsers.length})</h3>
          <div className="users-list">
            {stats.referredUsers.map((user) => (
              <div key={user.userId} className="user-card">
                <div className="user-info">
                  <span className="user-name">{user.username}</span>
                  <span className="user-date">
                    Joined {new Date(user.registeredAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="user-stats">
                  <span className="user-deposits">
                    {user.deposits} deposit{user.deposits !== 1 ? 's' : ''}
                  </span>
                  <span className="user-bonus">
                    +🪙 {user.bonusEarned.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.referredUsers.length === 0 && (
        <div className="empty-state">
          <p>👥 No referrals yet</p>
          <p className="empty-hint">Share your code to start earning bonuses!</p>
        </div>
      )}
    </div>
  );
}

export default ReferralDashboard;
