import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import GameTable from '../game/GameTable';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';

interface DashboardProps {
  username: string;
  coins: number;
  userId: string;
  initialCashBalance: number;
}

type GameType = 'teen-patti' | 'roulette' | null;
type GameMode = 'coins' | 'cash'; // coins = free play, cash = real money

const Dashboard: React.FC<DashboardProps> = ({ username, coins, initialCashBalance }) => {
  const socket = useSocket();
  const { setMyPlayerId } = useGameStore();
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [gameMode, setGameMode] = useState<GameMode>('coins'); // Default to coins mode
  const [currentCoins] = useState(coins); // Free coins (can't be refilled)
  const [cashBalance] = useState(initialCashBalance); // Real money balance
  const [joiningGame, setJoiningGame] = useState(false);
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

  const handleGameSelect = (gameType: GameType) => {
    if (gameType === 'roulette') {
      alert('Roulette coming soon! 🎰');
      return;
    }
    
    // Show mode selection modal for Teen Patti
    if (gameType === 'teen-patti') {
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
        alert('⚠️ You need at least ₹10 to play! Please go to Wallet page to add money.');
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
                <div className="mode-options">
                  <div className="mode-option-card" onClick={() => handleModeConfirm('coins')}>
                    <div className="mode-icon">🪙</div>
                    <h4>Coins Mode</h4>
                    <div className="mode-details">
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
                    <div className="mode-details">
                      <p>✓ Win real money</p>
                      <p className="mode-requirement">ℹ️ Minimum ₹10 required</p>
                    </div>
                    <button className="btn-select-mode">
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
