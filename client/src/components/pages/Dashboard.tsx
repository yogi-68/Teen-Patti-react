import React, { useState } from 'react';
import './Dashboard.css';

interface DashboardProps {
  username: string;
  coins: number;
  initialCashBalance: number;
  isSubscribed: boolean;
  userId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ username, coins, initialCashBalance, isSubscribed }) => {
  const [currentCoins] = useState(coins);
  const [cashBalance] = useState(initialCashBalance);

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <main className="main-content">
          <div className="welcome-screen">
            <h2>Welcome back, {username}!</h2>
            <p>Your gaming hub - check your stats and manage your account</p>
            
            <div className="dashboard-overview">
              <div className="stat-card">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <h3>Practice Coins</h3>
                  <p className="stat-value">{currentCoins}</p>
                  <p className="stat-label">Free play balance</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <h3>Cash Balance</h3>
                  <p className="stat-value">₹{cashBalance}</p>
                  <p className="stat-label">Real money balance</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">{isSubscribed ? '' : ''}</div>
                <div className="stat-info">
                  <h3>Subscription</h3>
                  <p className="stat-value">{isSubscribed ? 'Active' : 'Inactive'}</p>
                  <p className="stat-label">{isSubscribed ? 'Cash mode enabled' : 'Upgrade to play with cash'}</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn primary" onClick={() => window.location.href = '/game'}>
                   Play Games
                </button>
                <button className="action-btn" onClick={() => window.location.href = '/wallet'}>
                   Add Money
                </button>
                <button className="action-btn" onClick={() => window.location.href = '/profile'}>
                   View Profile
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
