import { useState, memo, useCallback, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';
import SoundManager from '../../utils/SoundManager';

interface NavigationProps {
  username: string;
  coins: number;
  tokenBalance: number;
  onLogout: () => void;
  isAdmin?: boolean;
}

const Navigation = memo<NavigationProps>(({ username, coins, tokenBalance, onLogout, isAdmin = false }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    setIsMusicOn(SoundManager.getMusicEnabled());
  }, []);
  
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
    SoundManager.playButtonClick();
  }, []);
  
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);
  
  const handleTabClick = useCallback(() => {
    SoundManager.playTabSwitch();
    closeMobileMenu();
  }, [closeMobileMenu]);
  
  const handleLogoutClick = useCallback(() => {
    SoundManager.playButtonClick();
    setShowLogoutConfirm(true);
  }, []);

  const handleConfirmLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    onLogout();
  }, [onLogout]);

  const handleCancelLogout = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  const toggleMusic = useCallback(() => {
    const newState = !isMusicOn;
    setIsMusicOn(newState);
    SoundManager.setMusicEnabled(newState);
    SoundManager.playButtonClick();
  }, [isMusicOn]);

  return (
    <>
      <nav className="navigation">
      <div className="nav-container">
        {/* Logo/Brand - Clickable, navigates to dashboard */}
        <NavLink to="/dashboard" className="nav-brand">
          <img src="/images/logo.jpg" alt="Teen Patti" className="brand-logo" />
          <span className="brand-name">Teen Patti</span>
        </NavLink>

        {/* Hamburger Menu Button - Admin Only on smaller screens */}
        {isAdmin && (
          <button 
            className={`hamburger-btn ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}

        {/* Navigation Tabs - Different for Admin vs Regular Users */}
        <div className={`nav-tabs ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {isAdmin ? (
            <>
              {/* Admin Navigation */}
              <NavLink 
                to="/admin" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
                onClick={handleTabClick}
              >
                <span className="tab-icon">⚙️</span>
                <span className="tab-text">Admin Panel</span>
              </NavLink>
              
              <NavLink 
                to="/admin/users" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
                onClick={handleTabClick}
              >
                <span className="tab-icon">👥</span>
                <span className="tab-text">Users</span>
              </NavLink>
              
              <NavLink 
                to="/admin/subscriptions" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
                onClick={handleTabClick}
              >
                <span className="tab-icon">⭐</span>
                <span className="tab-text">Subscriptions</span>
              </NavLink>
              
              <NavLink 
                to="/admin/transactions" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
                onClick={handleTabClick}
              >
                <span className="tab-icon">💰</span>
                <span className="tab-text">Transactions</span>
              </NavLink>
              
              <NavLink 
                to="/admin/bots" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
                onClick={handleTabClick}
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
                onClick={handleTabClick}
              >
                <span className="tab-icon">🎮</span>
                <span className="tab-text">Games</span>
              </NavLink>
              
              <NavLink 
                to="/wallet" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
                onClick={handleTabClick}
              >
                <span className="tab-icon">💎</span>
                <span className="tab-text">Wallet</span>
              </NavLink>
              
              <NavLink 
                to="/profile" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
                onClick={handleTabClick}
              >
                <span className="tab-icon">👤</span>
                <span className="tab-text">Profile</span>
              </NavLink>

              <NavLink 
                to="/settings" 
                className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
                onClick={handleTabClick}
              >
                <span className="tab-icon">❓</span>
                <span className="tab-text">Help</span>
              </NavLink>
            </>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="nav-user">
          {/* Music Toggle */}
          <button 
            className="music-toggle-btn" 
            onClick={toggleMusic}
            title={isMusicOn ? 'Music On' : 'Music Off'}
          >
            <span>{isMusicOn ? '🔊' : '🔇'}</span>
          </button>
          
          <div className="user-info">
            <div className="user-name">{username}</div>
            {!isAdmin && (
              <div className="user-balance">
                <span className="balance-item">
                  🪙 {coins}
                </span>
                <span className="balance-item">
                  ₹{tokenBalance}
                </span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogoutClick} title="Logout">
            Logout
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
});

Navigation.displayName = 'Navigation';

export default Navigation;
