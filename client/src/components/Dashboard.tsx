import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import GameTable from './GameTable';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';

interface DashboardProps {
  username: string;
  coins: number;
  onLogout: () => void;
}

type GameType = 'teen-patti' | 'roulette' | null;

const Dashboard: React.FC<DashboardProps> = ({ username, coins, onLogout }) => {
  const socket = useSocket();
  const { setMyPlayerId } = useGameStore();
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [currentCoins] = useState(coins);
  const [showWallet, setShowWallet] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);

  // Debug: Log socket connection status
  useEffect(() => {
    console.log('🔌 Socket status:', socket ? 'initialized' : 'null', socket?.connected ? 'connected' : 'disconnected');
  }, [socket?.connected]);

  const handleGameSelect = (game: GameType) => {
    if (game === 'roulette') {
      alert('Roulette coming soon! 🎰');
      return;
    }
    
    // Join the Teen Patti game
    if (game === 'teen-patti') {
      if (!socket || !socket.connected) {
        alert('❌ Connection lost! Please refresh the page.');
        return;
      }

      setJoiningGame(true);
      
      const playerInfo = {
        userName: username,
        chips: coins,
      };

      console.log('🎮 Attempting to join table...', playerInfo);
      socket.emit('joinTable', { tableId: 1, playerInfo });

      // Set timeout for joining
      const joinTimeout = setTimeout(() => {
        console.error('⏱️ Join timeout - no response from server');
        alert('⏱️ Connection timeout. Please try again.');
        setJoiningGame(false);
        socket.off('joinedTable');
        socket.off('error');
      }, 5000); // 5 second timeout

      socket.once('joinedTable', (data) => {
        clearTimeout(joinTimeout);
        console.log('✅ Joined table response:', data);
        
        if (data.success) {
          setMyPlayerId(data.playerId);
          setActiveGame(game);
          setJoiningGame(false);
          console.log('✅ Successfully joined! Showing game...');
        } else {
          alert(data.message || 'Failed to join table');
          setJoiningGame(false);
        }
      });

      socket.once('error', (error) => {
        clearTimeout(joinTimeout);
        console.error('❌ Error joining table:', error);
        alert(error.message || 'Failed to join table');
        setJoiningGame(false);
      });
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup listeners when component unmounts
      if (socket) {
        socket.off('joinedTable');
        socket.off('error');
      }
    };
  }, [socket]);

  const handleBackToDashboard = () => {
    setActiveGame(null);
  };

  return (
    <div className="dashboard-container">
      {/* Top Bar */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="logo">🎮 Teen Patti & Roulette</h1>
        </div>
        <div className="header-right">
          <div className="coin-display">
            <span className="coin-icon">🪙</span>
            <span className="coin-amount">{currentCoins.toLocaleString()}</span>
          </div>
          <div style={{ 
            marginRight: '15px', 
            padding: '5px 12px', 
            borderRadius: '20px', 
            background: socket?.connected ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)',
            border: `1px solid ${socket?.connected ? '#00ff00' : '#ff0000'}`,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: socket?.connected ? '#00ff00' : '#ff0000',
              boxShadow: socket?.connected ? '0 0 5px #00ff00' : '0 0 5px #ff0000'
            }}></span>
            {socket?.connected ? 'Online' : 'Offline'}
          </div>
          <button className="btn-wallet" onClick={() => setShowWallet(!showWallet)}>
            💰 Wallet
          </button>
          <div className="user-info">
            <span className="username">{username}</span>
          </div>
          <button className="btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeGame === 'teen-patti' ? 'active' : ''}`}
              onClick={() => handleGameSelect('teen-patti')}
            >
              <span className="nav-icon">🃏</span>
              <span className="nav-text">Play Teen Patti</span>
            </button>
            
            <button 
              className="nav-item"
              onClick={() => handleGameSelect('roulette')}
            >
              <span className="nav-icon">🎰</span>
              <span className="nav-text">Play Roulette</span>
              <span className="coming-soon">Coming Soon</span>
            </button>

            <div className="nav-divider"></div>

            <button 
              className="nav-item"
              onClick={() => setShowWallet(!showWallet)}
            >
              <span className="nav-icon">💳</span>
              <span className="nav-text">My Wallet</span>
            </button>

            <button className="nav-item">
              <span className="nav-icon">📊</span>
              <span className="nav-text">Subscription</span>
            </button>

            <button className="nav-item">
              <span className="nav-icon">💸</span>
              <span className="nav-text">Withdraw</span>
            </button>

            <div className="nav-divider"></div>

            <button className="nav-item">
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </button>

            <button className="nav-item">
              <span className="nav-icon">📞</span>
              <span className="nav-text">Contact Admin</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-main">
          {!activeGame && (
            <div className="welcome-screen">
              <h2>Welcome, {username}!</h2>
              <p>Select a game from the menu to start playing</p>
              
              <div className="game-cards">
                <div className="game-card" onClick={() => handleGameSelect('teen-patti')}>
                  <div className="game-card-icon">🃏</div>
                  <h3>Teen Patti</h3>
                  <p>Classic 3-card poker game</p>
                  <button className="btn-play" disabled={joiningGame}>
                    {joiningGame ? 'Joining...' : 'Play Now'}
                  </button>
                </div>

                <div className="game-card disabled" onClick={() => handleGameSelect('roulette')}>
                  <div className="game-card-icon">🎰</div>
                  <h3>Roulette</h3>
                  <p>Coming Soon!</p>
                  <button className="btn-play" disabled>Coming Soon</button>
                </div>
              </div>

              <div className="quick-stats">
                <div className="stat-box">
                  <div className="stat-label">Your Balance</div>
                  <div className="stat-value">🪙 {currentCoins.toLocaleString()}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Games Played</div>
                  <div className="stat-value">Coming Soon</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Win Rate</div>
                  <div className="stat-value">Coming Soon</div>
                </div>
              </div>
            </div>
          )}

          {activeGame === 'teen-patti' && (
            <div className="game-area">
              <div className="game-header">
                <button className="btn-back" onClick={handleBackToDashboard}>
                  ← Back to Dashboard
                </button>
                <h2>Teen Patti Game</h2>
              </div>
              <GameTable socket={socket} />
            </div>
          )}
        </main>
      </div>

      {/* Wallet Modal */}
      {showWallet && (
        <div className="modal-overlay" onClick={() => setShowWallet(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 My Wallet</h3>
              <button className="btn-close" onClick={() => setShowWallet(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="wallet-balance">
                <div className="balance-label">Current Balance</div>
                <div className="balance-amount">🪙 {currentCoins.toLocaleString()}</div>
              </div>
              
              <div className="wallet-actions">
                <button className="btn-wallet-action">
                  <span>➕</span> Add Coins
                </button>
                <button className="btn-wallet-action">
                  <span>💸</span> Withdraw
                </button>
              </div>

              <div className="wallet-history">
                <h4>Recent Transactions</h4>
                <p className="no-data">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
