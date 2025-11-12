import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameSelectionPage.css';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';

interface GameSelectionPageProps {
  username: string;
  coins: number;
  cashBalance: number;
  isSubscribed: boolean;
  userId: string;
}

type GameMode = 'coins' | 'cash';

const GameSelectionPage: React.FC<GameSelectionPageProps> = ({ 
  username = 'Player', 
  coins = 0, 
  cashBalance = 0, 
  isSubscribed = false,
  userId = ''
}) => {
  const navigate = useNavigate();
  const socket = useSocket();
  const { setMyPlayerId, connected } = useGameStore();
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);
  const [showGameDisclaimer, setShowGameDisclaimer] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  // Debug connection state
  useEffect(() => {
    console.log('🎮 GameSelectionPage - Connected state:', connected);
    console.log('🎮 GameSelectionPage - Socket:', socket ? 'exists' : 'null');
    if (socket) {
      console.log('🎮 GameSelectionPage - Socket.connected:', socket.connected);
    }
  }, [connected, socket]);
  
  // Get fresh balance from localStorage
  const [currentCoins, setCurrentCoins] = useState(() => {
    const stored = localStorage.getItem('practiceCoins');
    return stored ? Number(stored) : coins;
  });
  const [currentCashBalance, setCurrentCashBalance] = useState(() => {
    const stored = localStorage.getItem('realCoins');
    return stored ? Number(stored) : cashBalance;
  });

  // Update balances when props change
  useEffect(() => {
    const storedPractice = localStorage.getItem('practiceCoins');
    const storedReal = localStorage.getItem('realCoins');
    
    if (storedPractice) setCurrentCoins(Number(storedPractice));
    if (storedReal) setCurrentCashBalance(Number(storedReal));
  }, [coins, cashBalance]);

  useEffect(() => {
    if (!socket) return;

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      alert(`❌ ${error.message}`);
      setJoiningGame(false);
    });

    return () => {
      if (socket) {
        socket.off('joinedTable');
        socket.off('error');
      }
    };
  }, [socket]);

  const handleGameSelect = (gameType: 'teen-patti' | 'roulette') => {
    if (gameType === 'roulette') {
      alert('Roulette coming soon! 🎰');
      return;
    }
    
    // Show mode selection modal for Teen Patti
    if (gameType === 'teen-patti') {
      setShowModeSelection(true);
    }
  };

  const handleModeConfirm = (mode: GameMode) => {
    setShowModeSelection(false);
    
    // Check if user is trying to play cash mode without subscription
    if (mode === 'cash' && !isSubscribed) {
      // Redirect to profile page to subscribe
      navigate('/profile');
      return;
    }
    
    // Check balance based on selected mode
    const currentBalance = mode === 'coins' ? currentCoins : currentCashBalance;
    
    if (currentBalance < 10) {
      if (mode === 'coins') {
        alert('⚠️ You need at least 10 coins to play! Your free coins cannot be refilled. Switch to Cash Mode to continue.');
        return;
      } else {
        alert('⚠️ You need at least ₹10 to play! Please go to Wallet page to add money.');
        return;
      }
    }
    
    // Store selected mode and show disclaimer before joining
    setSelectedMode(mode);
    setShowGameDisclaimer(true);
  };

  const handleDisclaimerAccept = () => {
    setShowGameDisclaimer(false);
    
    if (!selectedMode) return;

    // Join the Teen Patti game
    if (!socket || !connected) {
      alert('❌ Connection not ready! Please wait a moment and try again.');
      return;
    }

    setJoiningGame(true);
    
    // Map 'coins' mode to 'practice' for server compatibility
    const gameMode = selectedMode === 'coins' ? 'practice' : 'real';
    
    // Get userId from props or localStorage, generate guest ID if missing
    let playerUserId = userId || localStorage.getItem('userId') || '';
    if (!playerUserId || playerUserId.trim() === '') {
      playerUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.warn('⚠️ No userId found, generated temporary guest ID:', playerUserId);
      localStorage.setItem('userId', playerUserId);
    }
    
    const playerInfo = {
      userName: username,
      userId: playerUserId,
      chips: selectedMode === 'coins' ? currentCoins : currentCashBalance,
    };

    // No tableId needed - server will find or create an available table
    socket.emit('joinTable', { playerInfo, gameMode });

    // Set timeout for joining
    const joinTimeout = setTimeout(() => {
      console.error('⏱️ Join timeout - no response from server');
      alert('⏱️ Connection timeout. Please try again.');
      setJoiningGame(false);
      if (socket) {
        socket.off('joinedTable');
        socket.off('error');
      }
    }, 5000);

    socket.once('joinedTable', (data) => {
      clearTimeout(joinTimeout);
      
      if (data.success) {
        setMyPlayerId(data.playerId);
        setJoiningGame(false);
        
        // Navigate to game page with game mode
        navigate('/game/teen-patti', { state: { gameMode: selectedMode } });
      } else {
        console.error('❌ Join failed:', data.message);
        alert(`❌ Failed to join: ${data.message}`);
        setJoiningGame(false);
      }
    });
  };

  return (
    <div className="game-selection-container">
      <div className="game-selection-content">
        <main className="game-selection-main">
          <div className="welcome-screen">
            <h2>Choose Your Game</h2>
            <p>Select a game to start playing</p>
            
            {/* Connection Status Indicator */}
            {!connected && (
              <div style={{ 
                padding: '10px', 
                margin: '10px 0', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                ⏳ Connecting to server...
              </div>
            )}
            
            <div className="game-cards">
              <div className="game-card" onClick={() => connected && !joiningGame && handleGameSelect('teen-patti')}>
                <div className="game-card-icon">🃏</div>
                <h3>Teen Patti</h3>
                <p>Classic 3-card poker game</p>
                <button className="btn-play" disabled={joiningGame || !connected}>
                  {!connected ? 'Connecting...' : joiningGame ? 'Joining...' : 'Play Now'}
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
        </main>
      </div>

      {/* Mode Selection Modal */}
      {showModeSelection && (
        <div className="modal-overlay" onClick={() => setShowModeSelection(false)}>
          <div className="wallet-modal mode-selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Game Mode</h2>
              <button className="close-btn" onClick={() => setShowModeSelection(false)}>×</button>
            </div>

            <div className="mode-selection-content">
              
              <div className="mode-options">
                <div className="mode-option-card" onClick={() => handleModeConfirm('coins')}>
                  <div className="mode-icon">🪙</div>
                  <h3>Coins Mode</h3>
                  <p className="mode-details">Play with practice coins</p>
                  <div className="balance-info">
                    <span className="balance-label">Your Balance:</span>
                    <span className="balance-amount">{currentCoins} coins</span>
                  </div>
                  <button className="mode-select-btn">Play with Coins</button>
                </div>

                <div className="mode-option-card" onClick={() => handleModeConfirm('cash')}>
                  <div className="mode-icon">💰</div>
                  <h3>Cash Mode</h3>
                  <p className="mode-details">Play with real money</p>
                  {!isSubscribed && (
                    <div className="subscription-badge">
                      <span>🔒 Subscription Required</span>
                    </div>
                  )}
                  <div className="balance-info">
                    <span className="balance-label">Your Balance:</span>
                    <span className="balance-amount">₹{currentCashBalance}</span>
                  </div>
                  <button className="mode-select-btn">
                    {isSubscribed ? 'Play with Cash' : 'Subscribe to Play'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Disclaimer Modal */}
      {showGameDisclaimer && (
        <div className="modal-overlay">
          <div className="wallet-modal disclaimer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ Game Disclaimer</h2>
            </div>

            <div className="disclaimer-content">
              <div className="disclaimer-section">
                <h3>🎮 Responsible Gaming</h3>
                <p>
                  This is a game of skill and chance. Please play responsibly and within your limits. 
                  Never bet more than you can afford to lose.
                </p>
              </div>

              <div className="disclaimer-section">
                <h3>📜 Terms & Conditions</h3>
                <ul>
                  <li>All game outcomes are final and cannot be disputed</li>
                  <li>Players must be 18+ years of age to participate</li>
                  <li>Fair play is enforced - cheating will result in immediate ban</li>
                  <li>Disconnections during active play may result in automatic fold</li>
                </ul>
              </div>

              <div className="disclaimer-section warning">
                <h3>⚠️ Important Notice</h3>
                <p>
                  {selectedMode === 'cash' 
                    ? 'You are about to play with REAL MONEY. All bets placed are final and non-refundable.'
                    : 'You are playing with practice coins. These coins have no real-world value and cannot be converted to cash.'
                  }
                </p>
              </div>

              <div className="disclaimer-section">
                <h3>🎯 Before You Start</h3>
                <ul>
                  <li>Ensure you understand the game rules</li>
                  <li>Check your balance before joining</li>
                  <li>Stable internet connection is recommended</li>
                  <li>Do not leave mid-game as it affects other players</li>
                </ul>
              </div>
            </div>

            <div className="disclaimer-footer">
              <p style={{ textAlign: 'center', color: '#888', marginBottom: '1rem' }}>
                By clicking "I Agree", you confirm that you have read and understood these terms.
              </p>
              <div className="disclaimer-actions">
                <button 
                  className="btn-cancel" 
                  onClick={() => {
                    setShowGameDisclaimer(false);
                    setSelectedMode(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-accept" 
                  onClick={handleDisclaimerAccept}
                >
                  I Agree - Start Playing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameSelectionPage;
