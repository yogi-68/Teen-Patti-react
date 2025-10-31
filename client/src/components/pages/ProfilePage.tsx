import './ProfilePage.css';

interface ProfilePageProps {
  username: string;
  coins: number;
  cashBalance: number;
  userId: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ username, coins, cashBalance, userId }) => {
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
          <button className="action-btn primary">
            <span>💰</span> Add Cash
          </button>
          <button className="action-btn">
            <span>⚙️</span> Settings
          </button>
          <button className="action-btn">
            <span>📊</span> Statistics
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
