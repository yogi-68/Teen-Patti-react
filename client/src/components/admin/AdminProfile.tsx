import React from 'react';
import './AdminProfile.css';

interface AdminProfileProps {
  username: string;
  email?: string;
  onLogout: () => void;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ username, email, onLogout }) => {
  return (
    <div className="admin-profile-container">
      <div className="admin-profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="avatar-icon">⚙️</span>
          </div>
          <h2>Administrator Profile</h2>
        </div>

        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">Username:</span>
            <span className="detail-value">{username}</span>
          </div>
          
          {email && (
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{email}</span>
            </div>
          )}
          
          <div className="detail-row">
            <span className="detail-label">Role:</span>
            <span className="detail-value role-badge">Administrator</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Access Level:</span>
            <span className="detail-value">Full Access</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="logout-btn" onClick={onLogout}>
            <span className="btn-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
