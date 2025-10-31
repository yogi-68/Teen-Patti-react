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
  
  // Minimum balance required to play (10 coins or ₹10)
  const MIN_BALANCE_TO_PLAY = 10;
  
  // Check if user has enough balance to play
  const hasEnoughBalance = coins >= MIN_BALANCE_TO_PLAY || cashBalance >= MIN_BALANCE_TO_PLAY;
  
  // Check if user has any balance at all
  const hasNoBalance = coins === 0 && cashBalance === 0;
  
  const handleGameTabClick = () => {
    if (!hasEnoughBalance) {
      alert(`Insufficient Balance!\n\nYou need at least ${MIN_BALANCE_TO_PLAY} coins or ₹${MIN_BALANCE_TO_PLAY} to play.\n\nYour current balance:\n🪙 Coins: ${coins}\n₹ Cash: ${cashBalance}\n\nPlease add cash or earn more coins to continue.`);
    }
  };

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
        {/* Logo/Brand */}
        <div className="nav-brand">
          <span className="brand-icon">🎴</span>
          <span className="brand-name">Teen Patti</span>
        </div>

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
                to="/dashboard" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
              >
                <span className="tab-icon">🏠</span>
                <span className="tab-text">Dashboard</span>
              </NavLink>
              
              {/* Game tab - Disabled due to insufficient balance or coming soon */}
              <div 
                className="nav-tab disabled" 
                onClick={handleGameTabClick}
                title={!hasEnoughBalance ? `Need ${MIN_BALANCE_TO_PLAY} coins or ₹${MIN_BALANCE_TO_PLAY} to play` : 'Coming Soon'}
              >
                <span className="tab-icon">🎮</span>
                <span className="tab-text">Play Game</span>
                <span className="coming-soon-badge">
                  {!hasEnoughBalance ? '💰 Low' : 'Soon'}
                </span>
              </div>
              
              <div className="nav-tab disabled" title="Coming Soon">
                <span className="tab-icon">🏆</span>
                <span className="tab-text">Leaderboard</span>
                <span className="coming-soon-badge">Soon</span>
              </div>
              
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
                <span className="tab-icon">⚙️</span>
                <span className="tab-text">Settings</span>
              </NavLink>
            </>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="nav-user">
          <div className="user-info">
            <div className="user-name">{username}</div>
            <div className="user-balance">
              <span className={`balance-item ${hasNoBalance ? 'balance-critical' : coins < MIN_BALANCE_TO_PLAY ? 'balance-low' : ''}`}>
                <span className="coin-icon">🪙</span> Practice: {coins}
              </span>
              <span className="balance-divider">|</span>
              <span className={`balance-item ${hasNoBalance ? 'balance-critical' : cashBalance < MIN_BALANCE_TO_PLAY ? 'balance-low' : ''}`}>
                <span className="cash-icon">₹</span> Real: {cashBalance}
              </span>
            </div>
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
