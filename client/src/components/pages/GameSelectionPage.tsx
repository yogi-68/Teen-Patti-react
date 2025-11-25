import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameSelectionPage.css';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';

interface GameSelectionPageProps {
  username: string;
  trial: number;
  tokenBalance: number;
  isSubscribed: boolean;
  userId: string;
}

type GameMode = 'trial' | 'token';

const GameSelectionPage: React.FC<GameSelectionPageProps> = ({ 
  username = 'Player', 
  trial = 0, 
  tokenBalance = 0, 
  isSubscribed = false,
  userId = ''
}) => {
  const navigate = useNavigate();
  const socket = useSocket();
  const { setMyPlayerId, setTableState, connected } = useGameStore();
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);
  const [showGameDisclaimer, setShowGameDisclaimer] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [showPrivateTableOptions, setShowPrivateTableOptions] = useState(false);
  const [showCreatePrivateTable, setShowCreatePrivateTable] = useState(false);
  const [showJoinPrivateTable, setShowJoinPrivateTable] = useState(false);
  const [privateTableCode, setPrivateTableCode] = useState('');
  const [creatingPrivateTable, setCreatingPrivateTable] = useState(false);
  const [showCodeDisplay, setShowCodeDisplay] = useState(false);
  const [createdTableCode, setCreatedTableCode] = useState('');
  const [createdTableId, setCreatedTableId] = useState<number | null>(null);

  // Debug connection state
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🎮 GameSelectionPage - Connected state:', connected);
      console.log('🎮 GameSelectionPage - Socket:', socket ? 'exists' : 'null');
      if (socket) {
        console.log('🎮 GameSelectionPage - Socket.connected:', socket.connected);
      }
    }
  }, [connected, socket]);
  
  // Get fresh balance from localStorage
  const [currentTrial, setCurrentTrial] = useState(() => {
    const stored = localStorage.getItem('practiceTrial');
    return stored ? Number(stored) : trial;
  });
  const [currentTokenBalance, setCurrentTokenBalance] = useState(() => {
    const stored = localStorage.getItem('realToken');
    return stored ? Number(stored) : tokenBalance;
  });

  // Update balances when props change
  useEffect(() => {
    const storedPractice = localStorage.getItem('practiceTrial');
    const storedReal = localStorage.getItem('realToken');
    
    if (storedPractice) setCurrentTrial(Number(storedPractice));
    if (storedReal) setCurrentTokenBalance(Number(storedReal));
  }, [trial, tokenBalance]);

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
    
    // Check if user is trying to play token mode without subscription
    if (mode === 'token' && !isSubscribed) {
      // Redirect to profile page to subscribe
      navigate('/profile');
      return;
    }
    
    // Check balance based on selected mode
    const currentBalance = mode === 'trial' ? currentTrial : currentTokenBalance;
    
    if (currentBalance < 10) {
      if (mode === 'trial') {
        alert('⚠️ You need at least 10 trial to play! Your free trial cannot be refilled. Switch to Token Mode to continue.');
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

  const handleCreatePrivateTable = () => {
    setShowModeSelection(false);
    setShowCreatePrivateTable(true);
  };

  const handleJoinPrivateTableOption = () => {
    setShowModeSelection(false);
    setShowJoinPrivateTable(true);
  };

  const handleCreatePrivateTableConfirm = (mode: GameMode) => {
    setShowCreatePrivateTable(false);
    
    if (mode === 'token' && !isSubscribed) {
      navigate('/profile');
      return;
    }
    
    const currentBalance = mode === 'trial' ? currentTrial : currentTokenBalance;
    if (currentBalance < 10) {
      alert(mode === 'trial' 
        ? '⚠️ You need at least 10 trial to create a table!' 
        : '⚠️ You need at least ₹10 to create a table!');
      return;
    }

    if (!socket || !connected) {
      alert('❌ Connection not ready! Please wait.');
      return;
    }

    setCreatingPrivateTable(true);
    const gameMode = mode === 'trial' ? 'practice' : 'real';
    
    socket.emit('createPrivateTable', {
      creatorId: userId,
      creatorUsername: username,
      gameMode,
      bootAmount: 1,
    });

    socket.once('privateTableCreated', (data) => {
      setCreatingPrivateTable(false);
      if (data.success) {
        setCreatedTableCode(data.tableCode);
        setCreatedTableId(data.tableId);
        setShowCodeDisplay(true);
      }
    });

    socket.once('error', (error) => {
      setCreatingPrivateTable(false);
      alert(`❌ ${error.message}`);
    });
  };

  const handleJoinPrivateTableWithCode = () => {
    if (!privateTableCode || privateTableCode.trim().length !== 6) {
      alert('⚠️ Please enter a valid 6-character table code');
      return;
    }

    if (!socket || !connected) {
      alert('❌ Connection not ready! Please wait.');
      return;
    }

    setJoiningGame(true);

    const playerUserId = userId || localStorage.getItem('userId') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const playerInfo = {
      userName: username,
      userId: playerUserId,
      chips: currentTrial || currentTokenBalance,
    };

    socket.emit('joinPrivateTable', { tableCode: privateTableCode.toUpperCase(), playerInfo });

    const joinTimeout = setTimeout(() => {
      alert('⏱️ Connection timeout. Please try again.');
      setJoiningGame(false);
    }, 5000);

    socket.once('joinedTable', (data) => {
      clearTimeout(joinTimeout);
      setJoiningGame(false);
      
      if (data.success) {
        setMyPlayerId(data.playerId);
        setShowJoinPrivateTable(false);
        navigate('/game/teen-patti', { state: { gameMode: 'trial', isPrivate: true } });
      }
    });

    socket.once('error', (error) => {
      clearTimeout(joinTimeout);
      setJoiningGame(false);
      alert(`❌ ${error.message}`);
    });
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
    
    // Clear any old table state before joining new table
    setTableState(null);
    
    // Map 'trial' mode to 'practice' for server compatibility
    const gameMode = selectedMode === 'trial' ? 'practice' : 'real';
    
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
      chips: selectedMode === 'trial' ? currentTrial : currentTokenBalance,
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
                padding: '15px', 
                margin: '10px 0', 
                background: 'rgba(255, 243, 205, 0.2)', 
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                textAlign: 'center',
                backdropFilter: 'blur(5px)',
                color: '#ffd700',
                fontWeight: '600'
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
              <div className="mode-section">
                <h3 style={{ color: '#ffd700', marginBottom: '1rem' }}>🎯 Quick Play</h3>
                <div className="mode-options">
                  <div className="mode-option-card" onClick={() => handleModeConfirm('trial')}>
                    <div className="mode-icon">🪙</div>
                    <h3>Trial Mode</h3>
                    <p className="mode-details">Join public table</p>
                    <div className="balance-info">
                      <span className="balance-label">Your Balance:</span>
                      <span className="balance-amount">{currentTrial} trial</span>
                    </div>
                    <button className="mode-select-btn">Play with Trial</button>
                  </div>

                  <div className="mode-option-card" onClick={() => handleModeConfirm('token')}>
                    <div className="mode-icon">💰</div>
                    <h3>Token Mode</h3>
                    <p className="mode-details">Join public table</p>
                    {!isSubscribed && (
                      <div className="subscription-badge">
                        <span>🔒 Subscription Required</span>
                      </div>
                    )}
                    <div className="balance-info">
                      <span className="balance-label">Your Balance:</span>
                      <span className="balance-amount">₹{currentTokenBalance}</span>
                    </div>
                    <button className="mode-select-btn">
                      {isSubscribed ? 'Play with Token' : 'Subscribe to Play'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mode-section" style={{ marginTop: '2rem' }}>
                <h3 style={{ color: '#ffd700', marginBottom: '1rem' }}>🔐 Private Tables</h3>
                <div className="private-table-options" style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="private-table-btn" 
                    onClick={handleCreatePrivateTable}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ➕ Create Private Table
                  </button>
                  <button 
                    className="private-table-btn" 
                    onClick={handleJoinPrivateTableOption}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    🔑 Join with Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Private Table Modal */}
      {showCreatePrivateTable && (
        <div className="modal-overlay" onClick={() => setShowCreatePrivateTable(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Private Table</h2>
              <button className="close-btn" onClick={() => setShowCreatePrivateTable(false)}>×</button>
            </div>
            <div className="mode-selection-content">
              <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#888' }}>
                Select game mode for your private table (max 5 players)
              </p>
              <div className="mode-options">
                <div className="mode-option-card" onClick={() => !creatingPrivateTable && handleCreatePrivateTableConfirm('trial')}>
                  <div className="mode-icon">🪙</div>
                  <h3>Trial Mode</h3>
                  <p className="mode-details">Play with friends using trial</p>
                  <div className="balance-info">
                    <span className="balance-amount">{currentTrial} trial</span>
                  </div>
                  <button className="mode-select-btn" disabled={creatingPrivateTable}>
                    {creatingPrivateTable ? 'Creating...' : 'Create Table'}
                  </button>
                </div>
                <div className="mode-option-card" onClick={() => !creatingPrivateTable && handleCreatePrivateTableConfirm('token')}>
                  <div className="mode-icon">💰</div>
                  <h3>Token Mode</h3>
                  <p className="mode-details">Play with friends using token</p>
                  {!isSubscribed && (
                    <div className="subscription-badge">
                      <span>🔒 Subscription Required</span>
                    </div>
                  )}
                  <div className="balance-info">
                    <span className="balance-amount">₹{currentTokenBalance}</span>
                  </div>
                  <button className="mode-select-btn" disabled={creatingPrivateTable}>
                    {creatingPrivateTable ? 'Creating...' : isSubscribed ? 'Create Table' : 'Subscribe First'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Code Display Modal */}
      {showCodeDisplay && (
        <div className="modal-overlay" onClick={() => setShowCodeDisplay(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>🎉 Private Table Created!</h2>
              <button className="close-btn" onClick={() => setShowCodeDisplay(false)}>×</button>
            </div>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '16px' }}>
                Share this code with your friends to join your private table
              </p>
              
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.1) 100%)',
                border: '3px solid #ffd700',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px', fontWeight: 'bold' }}>
                  TABLE CODE
                </div>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5rem',
                  color: '#ffd700',
                  fontFamily: 'monospace',
                  textShadow: '0 0 20px rgba(255,215,0,0.5)',
                }}>
                  {createdTableCode}
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdTableCode);
                  alert('📋 Code copied to clipboard!');
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                }}
              >
                📋 Copy Code
              </button>

              <button
                onClick={() => {
                  setShowCodeDisplay(false);
                  // Auto-join the creator to their own table
                  const playerUserId = userId || localStorage.getItem('userId') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  const playerInfo = {
                    userName: username,
                    userId: playerUserId,
                    chips: currentTrial || currentTokenBalance,
                  };
                  socket?.emit('joinPrivateTable', { tableCode: createdTableCode, playerInfo });
                  
                  socket?.once('joinedTable', (data) => {
                    if (data.success) {
                      setMyPlayerId(data.playerId);
                      navigate('/game/teen-patti', { state: { gameMode: 'trial', isPrivate: true } });
                    }
                  });
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                🎮 Join My Table Now
              </button>

              <p style={{ marginTop: '1.5rem', fontSize: '14px', color: '#666' }}>
                ℹ️ Maximum 5 players • Table expires in 24 hours
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Join Private Table Modal */}
      {showJoinPrivateTable && (
        <div className="modal-overlay" onClick={() => setShowJoinPrivateTable(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Join Private Table</h2>
              <button className="close-btn" onClick={() => setShowJoinPrivateTable(false)}>×</button>
            </div>
            <div style={{ padding: '2rem' }}>
              <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#888' }}>
                Enter the 6-character table code shared by your friend
              </p>
              <input
                type="text"
                value={privateTableCode}
                onChange={(e) => setPrivateTableCode(e.target.value.toUpperCase())}
                placeholder="Enter Code (e.g., ABC123)"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '0.3rem',
                  textTransform: 'uppercase',
                  border: '2px solid #ffd700',
                  borderRadius: '8px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  color: '#ffd700',
                  fontWeight: 'bold',
                  marginBottom: '1.5rem',
                }}
              />
              <button
                onClick={handleJoinPrivateTableWithCode}
                disabled={joiningGame || privateTableCode.length !== 6}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: privateTableCode.length === 6 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: privateTableCode.length === 6 ? 'pointer' : 'not-allowed',
                  opacity: privateTableCode.length === 6 ? 1 : 0.5,
                }}
              >
                {joiningGame ? 'Joining...' : 'Join Table'}
              </button>
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
                  {selectedMode === 'token' 
                    ? 'You are about to play with REAL TOKEN. All bets placed are final and non-refundable.'
                    : 'You are playing with practice trial. These trial have no real-world value and cannot be converted to cash.'
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
