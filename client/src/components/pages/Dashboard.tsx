import React, { useState, useEffect } from 'react';
import GameTour from '../common/GameTour';
import './Dashboard.css';

interface DashboardProps {
  username: string;
  coins: number;
  initialCashBalance: number;
  isSubscribed: boolean;
  userId: string;
  hasSeenTour: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ username, hasSeenTour }) => {
  const [runTour, setRunTour] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    // Only show tour for new users who haven't seen it
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, [hasSeenTour]);

  const handleTourEnd = async () => {
    setRunTour(false);
    
    // Update user's hasSeenTour flag in database
    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        await fetch(`${API_URL}/users/${userId}/tour-completed`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });
        
        // Update localStorage
        localStorage.setItem('hasSeenTour', 'true');
      } catch (error) {
        console.error('Error updating tour status:', error);
      }
    }
  };

  return (
    <div className="dashboard-container">
      <GameTour runTour={runTour} onTourEnd={handleTourEnd} />
      <div className="dashboard-content">
        <main className="main-content">
          <div className="welcome-section">
            <div className="greeting">
              <h1 className="welcome-title">Welcome back, <span className="username-highlight">{username}</span>!</h1>
            </div>
            
            <div className="promotional-content">
              <div className="promo-card">
                <div className="promo-icon">??</div>
                <h2 className="promo-heading">Experience the Thrill of Teen Patti</h2>
                <p className="promo-text">
                  Step into the world of India's most beloved card game! Teen Patti brings you the authentic 
                  experience of traditional card gaming with a modern twist. Whether you're a seasoned player 
                  or just starting your journey, our platform offers the perfect blend of excitement, strategy, 
                  and entertainment. Play with friends, compete with players worldwide, and master the art of 
                  bluffing and betting in this timeless classic.
                </p>
              </div>

              <div className="promo-card">
                <div className="promo-icon">??</div>
                <h2 className="promo-heading">Play Your Way - Practice or Real Money</h2>
                <p className="promo-text">
                  Start your gaming adventure with free practice coins to hone your skills without any risk. 
                  Once you're confident, upgrade to our premium subscription and unlock real money gameplay 
                  where every hand counts! Enjoy secure transactions, instant withdrawals, and exclusive 
                  premium tables. With fair gameplay, 24/7 support, and exciting tournaments, Teen Patti 
                  offers endless opportunities to showcase your skills and win big. Join thousands of players 
                  and make every game count!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
