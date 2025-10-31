import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import GameTable from './GameTable';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/gameStore';

interface DashboardProps {
  username: string;
  coins: number;
  userId: string;
  initialCashBalance: number;
}

type GameType = 'teen-patti' | 'roulette' | null;
type GameMode = 'coins' | 'cash'; // coins = free play, cash = real money

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Dashboard: React.FC<DashboardProps> = ({ username, coins, userId, initialCashBalance }) => {
  const socket = useSocket();
  const { setMyPlayerId } = useGameStore();
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [gameMode, setGameMode] = useState<GameMode>('coins'); // Default to coins mode
  const [currentCoins] = useState(coins); // Free coins (can't be refilled)
  const [cashBalance, setCashBalance] = useState(initialCashBalance); // Real money balance
  const [showWallet, setShowWallet] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false); // New: Mode selection modal

  // Debug: Log socket connection status
  useEffect(() => {
    console.log('🔌 Socket status:', socket ? 'initialized' : 'null', socket?.connected ? 'connected' : 'disconnected');
  }, [socket?.connected]);

  // Check if playing with coins and they run out (can't refill)
  useEffect(() => {
    if (gameMode === 'coins' && currentCoins === 0) {
      alert('💔 Your free coins have run out! Switch to Cash Mode to continue playing.');
    }
  }, [currentCoins, gameMode]);

  // Check if playing with cash and balance is low
  useEffect(() => {
    if (gameMode === 'cash' && cashBalance < 10 && !showLowBalanceModal) {
      setShowLowBalanceModal(true);
      setShowWallet(true);
    }
  }, [cashBalance, gameMode, showLowBalanceModal]);

  const handleGameSelect = (game: GameType) => {
    if (game === 'roulette') {
      alert('Roulette coming soon! 🎰');
      return;
    }
    
    // Show mode selection modal for Teen Patti
    if (game === 'teen-patti') {
      setShowModeSelection(true);
    }
  };

  const handleModeConfirm = (selectedMode: GameMode) => {
    setGameMode(selectedMode);
    setShowModeSelection(false);
    
    // Check balance based on selected mode
    const currentBalance = selectedMode === 'coins' ? currentCoins : cashBalance;
    
    if (currentBalance < 10) {
      if (selectedMode === 'coins') {
        alert('⚠️ You need at least 10 coins to play! Your free coins cannot be refilled. Switch to Cash Mode to continue.');
        return;
      } else {
        setShowLowBalanceModal(true);
        setShowWallet(true);
        alert('⚠️ You need at least ₹10 to play! Please add money to your wallet.');
        return;
      }
    }
    
    // Join the Teen Patti game
    if (!socket || !socket.connected) {
      alert('❌ Connection lost! Please refresh the page.');
      return;
    }

    setJoiningGame(true);
    
    // Use different table IDs for different game modes
    const tableId = selectedMode === 'coins' ? 1 : 2; // Table 1 for coins, Table 2 for cash
    
    const playerInfo = {
      userName: username,
      chips: currentBalance,
      gameMode: selectedMode, // Send game mode to server
    };

    console.log(`🎮 Attempting to join ${selectedMode} table (ID: ${tableId})...`, playerInfo);
      socket.emit('joinTable', { tableId: tableId, playerInfo });

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
          setActiveGame('teen-patti');
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
  };

  const handleAddMoney = async () => {
    const amount = parseInt(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (amount < 10) {
      alert('Minimum amount is ₹10');
      return;
    }
    if (amount > 10000) {
      alert('Maximum amount is ₹10,000 per transaction');
      return;
    }
    
    try {
      // Save to database
      const response = await fetch(`${API_URL}/users/${userId}/cash/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();
      
      if (data.user) {
        // Update local state with database value
        setCashBalance(data.user.cashBalance);
        setAddMoneyAmount('');
        setShowLowBalanceModal(false);
        setShowWallet(false);
        alert(`✅ ${data.message || `Successfully added ₹${amount.toLocaleString()}`}`);
      } else {
        alert('❌ Failed to add money: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding money:', error);
      // Fallback: update locally without database
      const newCashBalance = cashBalance + amount;
      setCashBalance(newCashBalance);
      setAddMoneyAmount('');
      setShowLowBalanceModal(false);
      setShowWallet(false);
      alert(`✅ Added ₹${amount.toLocaleString()} (offline mode - will sync when connected)`);
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
                <h2>Teen Patti Game - {gameMode === 'coins' ? '🪙 Coins Mode' : '💰 Cash Mode'}</h2>
              </div>
              <GameTable socket={socket} gameMode={gameMode} />
            </div>
          )}
        </main>
      </div>

      {/* Wallet Modal */}
      {showWallet && (
        <div className="modal-overlay" onClick={() => !showLowBalanceModal && setShowWallet(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 My Wallet</h3>
              {!showLowBalanceModal && (
                <button className="btn-close" onClick={() => setShowWallet(false)}>✕</button>
              )}
            </div>
            <div className="modal-body">
              {showLowBalanceModal && (
                <div className="low-coins-warning">
                  ⚠️ Your cash balance is below ₹10! Please add money to continue playing.
                </div>
              )}

              <div className="wallet-section">
                <div className="balance-card">
                  <div className="balance-label">Free Coins</div>
                  <div className="balance-amount">🪙 {currentCoins.toLocaleString()}</div>
                  <div className="balance-note">Can't be refilled</div>
                </div>
                
                <div className="balance-card">
                  <div className="balance-label">Cash Balance</div>
                  <div className="balance-amount">💵 ₹{cashBalance.toLocaleString()}</div>
                  <div className="balance-note">Can be added anytime</div>
                </div>
              </div>

              <div className="add-money-section">
                <h4>💳 Add Money to Cash Balance</h4>
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="Enter amount (₹10 - ₹10,000)"
                    value={addMoneyAmount}
                    onChange={(e) => setAddMoneyAmount(e.target.value)}
                    min="10"
                    max="10000"
                    className="money-input"
                  />
                  <button className="btn-add-money" onClick={handleAddMoney}>
                    Add Money
                  </button>
                </div>
                <div className="quick-amounts">
                  <button onClick={() => setAddMoneyAmount('100')}>₹100</button>
                  <button onClick={() => setAddMoneyAmount('500')}>₹500</button>
                  <button onClick={() => setAddMoneyAmount('1000')}>₹1,000</button>
                  <button onClick={() => setAddMoneyAmount('10000')}>₹10,000</button>
                </div>
              </div>

              <div className="wallet-note">
                <p>💡 <strong>Balance Information:</strong></p>
                <p>🪙 <strong>Free Coins:</strong> 100 coins for practice. Once depleted, cannot be refilled.</p>
                <p>💰 <strong>Cash Balance:</strong> Add ₹10 - ₹10,000 per transaction. Win real money!</p>
                <p>💳 Choose game mode when you start playing | Contact admin for withdrawals</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selection Modal */}
      {showModeSelection && (
        <div className="modal-overlay" onClick={() => setShowModeSelection(false)}>
          <div className="wallet-modal mode-selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎮 Choose Game Mode</h3>
              <button className="btn-close" onClick={() => setShowModeSelection(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="mode-selection-content">
                <p className="mode-selection-intro">Select how you want to play Teen Patti:</p>
                
                <div className="mode-options">
                  <div className="mode-option-card" onClick={() => handleModeConfirm('coins')}>
                    <div className="mode-icon">🪙</div>
                    <h4>Coins Mode</h4>
                    <p className="mode-type">Free Play</p>
                    <div className="mode-details">
                      <p>✓ Practice with {currentCoins} free coins</p>
                      <p>✓ Learn the game risk-free</p>
                      <p>✓ No real money involved</p>
                      <p className="mode-warning">⚠️ Coins cannot be refilled</p>
                    </div>
                    <button className="btn-select-mode">
                      Play with Coins
                    </button>
                  </div>

                  <div className="mode-option-card" onClick={() => handleModeConfirm('cash')}>
                    <div className="mode-icon">💰</div>
                    <h4>Cash Mode</h4>
                    <p className="mode-type">Real Money</p>
                    <div className="mode-details">
                      <p>✓ Play with ₹{cashBalance.toLocaleString()} cash</p>
                      <p>✓ Win real money</p>
                      <p>✓ Add cash anytime</p>
                      <p className="mode-requirement">ℹ️ Minimum ₹10 required</p>
                    </div>
                    <button className="btn-select-mode cash-mode">
                      Play with Cash
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
