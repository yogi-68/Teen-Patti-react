import { NavLink } from 'react-router-dom';
import './Navigation.css';

interface NavigationProps {
  username: string;
  coins: number;
  cashBalance: number;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ username, coins, cashBalance, onLogout }) => {
  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo/Brand */}
        <div className="nav-brand">
          <span className="brand-icon">🎴</span>
          <span className="brand-name">Teen Patti</span>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
          >
            <span className="tab-icon">🏠</span>
            <span className="tab-text">Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/game" 
            className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
          >
            <span className="tab-icon">🎮</span>
            <span className="tab-text">Play Game</span>
          </NavLink>
          
          <NavLink 
            to="/leaderboard" 
            className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
          >
            <span className="tab-icon">🏆</span>
            <span className="tab-text">Leaderboard</span>
          </NavLink>
          
          <NavLink 
            to="/profile" 
            className={({ isActive }) => isActive ? 'nav-tab active' : 'nav-tab'}
          >
            <span className="tab-icon">👤</span>
            <span className="tab-text">Profile</span>
          </NavLink>
        </div>

        {/* User Info & Logout */}
        <div className="nav-user">
          <div className="user-info">
            <div className="user-name">{username}</div>
            <div className="user-balance">
              <span className="balance-item">
                <span className="coin-icon">🪙</span> {coins}
              </span>
              <span className="balance-divider">|</span>
              <span className="balance-item">
                <span className="cash-icon">₹</span> {cashBalance}
              </span>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <span>🚪</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
