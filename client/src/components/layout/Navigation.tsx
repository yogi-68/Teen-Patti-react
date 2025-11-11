import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

interface NavigationProps {
  username: string;
  coins: number;
  cashBalance: number;
  onLogout: () => void;
  isAdmin?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ username, coins, cashBalance, onLogout, isAdmin = false }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <nav className="navigation">
      <div className="nav-container">
        {/* Logo/Brand - Clickable, navigates to dashboard */}
        <NavLink to="/dashboard" className="nav-brand">
          <span className="brand-icon">🎴</span>
          <span className="brand-name">Teen Patti</span>
        </NavLink>

        {/* Navigation Tabs - Different for Admin vs Regular Users */}
        <div className="nav-tabs">
          {isAdmin ? (
            <>
              {/* Admin Navigation */}
              <NavLink 
                to="/admin" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">⚙️</span>
                <span className="tab-text">Admin Panel</span>
              </NavLink>
              
              <NavLink 
                to="/admin/users" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">👥</span>
                <span className="tab-text">Users</span>
              </NavLink>
              
              <NavLink 
                to="/admin/subscriptions" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">⭐</span>
                <span className="tab-text">Subscriptions</span>
              </NavLink>
              
              <NavLink 
                to="/admin/transactions" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">💰</span>
                <span className="tab-text">Transactions</span>
              </NavLink>
              
              <NavLink 
                to="/admin/bots" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">🤖</span>
                <span className="tab-text">Bot Management</span>
              </NavLink>
              
              <NavLink 
                to="/profile" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">👤</span>
                <span className="tab-text">Profile</span>
              </NavLink>
            </>
          ) : (
            <>
              {/* Regular User Navigation */}
              <NavLink 
                to="/game" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">🎮</span>
                <span className="tab-text">Games</span>
              </NavLink>
              
              <NavLink 
                to="/wallet" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">💎</span>
                <span className="tab-text">Wallet</span>
              </NavLink>
              
              <NavLink 
                to="/profile" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">👤</span>
                <span className="tab-text">Profile</span>
              </NavLink>

              <NavLink 
                to="/settings" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">❓</span>
                <span className="tab-text">Help</span>
              </NavLink>
            </>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="nav-user">
          <div className="user-info">
            <div className="user-name">{username}</div>
            {!isAdmin && (
              <div className="user-balance">
                <span className="balance-item">
                  🪙 {coins}
                </span>
                <span className="balance-item">
                  ₹{cashBalance}
                </span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogoutClick} title="Logout">
            <span>🚪</span>
          </button>
        </div>
      </div>
    </nav>

    {/* Logout Confirmation Modal */}
    {showLogoutConfirm && (
      <div className="logout-overlay" onClick={handleCancelLogout}>
        <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
          <div className="logout-icon">🚪</div>
          <h3 className="logout-title">Confirm Logout</h3>
          <p className="logout-message">
            Are you sure you want to logout?
            <br />
            Your progress will be saved.
          </p>
          <div className="logout-actions">
            <button className="logout-cancel-btn" onClick={handleCancelLogout}>
              Cancel
            </button>
            <button className="logout-confirm-btn" onClick={handleConfirmLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default Navigation;
