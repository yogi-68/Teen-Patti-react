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
  username, 
  coins, 
  cashBalance, 
  isSubscribed
}) => {
  const navigate = useNavigate();
  const socket = useSocket();
  const { setMyPlayerId } = useGameStore();
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);
  const [currentCoins] = useState(coins);
  const [currentCashBalance] = useState(cashBalance);

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

  const handleModeConfirm = (selectedMode: GameMode) => {
    setShowModeSelection(false);
    
    // Check if user is trying to play cash mode without subscription
    if (selectedMode === 'cash' && !isSubscribed) {
      setShowSubscriptionPrompt(true);
      return;
    }
    
    // Check balance based on selected mode
    const currentBalance = selectedMode === 'coins' ? currentCoins : currentCashBalance;
    
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
    const tableId = selectedMode === 'coins' ? 1 : 2;
    
    const playerInfo = {
      userName: username,
      chips: currentBalance,
      gameMode: selectedMode,
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
    }, 5000);

    socket.once('joinedTable', (data) => {
      clearTimeout(joinTimeout);
      console.log('✅ Joined table response:', data);
      
      if (data.success) {
        setMyPlayerId(data.playerId);
        setJoiningGame(false);
        console.log('✅ Successfully joined! Navigating to game...');
        
        // Navigate to game page with game mode
        navigate('/game/teen-patti', { state: { gameMode: selectedMode } });
      } else {
        console.error('❌ Join failed:', data.message);
        alert(`❌ Failed to join: ${data.message}`);
        setJoiningGame(false);
      }
    });
  };

  const handleSubscriptionPromptClose = () => {
    setShowSubscriptionPrompt(false);
  };

  return (
    <div className="game-selection-container">
      <div className="game-selection-content">
        <main className="game-selection-main">
          <div className="welcome-screen">
            <h2>Choose Your Game</h2>
            <p>Select a game to start playing</p>
            
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
              <p className="mode-description">Choose how you want to play Teen Patti:</p>
              
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
                  <button className="mode-select-btn" disabled={!isSubscribed}>
                    {isSubscribed ? 'Play with Cash' : 'Subscribe to Play'}
                  </button>
                </div>
              </div>

              <div className="mode-note">
                <p>💡 <strong>Coins Mode:</strong> Practice mode with free coins (non-refillable)</p>
                <p>💡 <strong>Cash Mode:</strong> Real money mode - requires subscription</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Prompt Modal */}
      {showSubscriptionPrompt && (
        <div className="modal-overlay" onClick={handleSubscriptionPromptClose}>
          <div className="wallet-modal subscription-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔒 Subscription Required</h2>
              <button className="close-btn" onClick={handleSubscriptionPromptClose}>×</button>
            </div>

            <div className="subscription-prompt-content">
              <p>To play with real money (Cash Mode), you need an active subscription.</p>
              
              <div className="subscription-benefits">
                <h3>Premium Benefits:</h3>
                <ul>
                  <li>✅ Play with real money</li>
                  <li>✅ Win real cash prizes</li>
                  <li>✅ Access to exclusive tables</li>
                  <li>✅ Priority support</li>
                </ul>
              </div>

              <div className="subscription-actions">
                <button 
                  className="btn-subscribe" 
                  onClick={() => navigate('/wallet')}
                >
                  Go to Wallet to Subscribe
                </button>
                <button 
                  className="btn-cancel" 
                  onClick={handleSubscriptionPromptClose}
                >
                  Maybe Later
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
