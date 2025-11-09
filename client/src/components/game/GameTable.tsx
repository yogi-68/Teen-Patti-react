import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { useGameStore } from '../../store/gameStore';
import PlayerCard from './PlayerCard.tsx';
import BettingPanel from './BettingPanel.tsx';
import './GameTable.css';

interface GameTableProps {
  socket: Socket | null;
  gameMode: 'coins' | 'cash'; // Pass game mode from Dashboard
}

function GameTable({ socket, gameMode }: GameTableProps) {
  const navigate = useNavigate();
  const { tableState, myPlayerId, setTableState } = useGameStore();
  const [timerData, setTimerData] = useState<{ playerId: string; timeLeft: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);

  // Currency symbol based on game mode
  const currencySymbol = gameMode === 'coins' ? '🪙' : '₹';

  // Handle leave game - show modal
  const handleLeaveGame = () => {
    setShowLeaveModal(true);
  };

  // Confirm leave game
  const confirmLeaveGame = () => {
    // Emit leave/fold event to server
    if (socket && tableState) {
      socket.emit('fold', { 
        tableId: tableState.id, 
        playerId: myPlayerId 
      });
      
      // Disconnect from socket
      socket.disconnect();
    }

    // Close modal and navigate immediately
    setShowLeaveModal(false);
    
    // Use replace to prevent going back to game with browser back button
    navigate('/dashboard', { replace: true });
  };

  // Cancel leave game
  const cancelLeaveGame = () => {
    setShowLeaveModal(false);
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('turnTimer', (data: { playerId: string; timeLeft: number }) => {
      setTimerData(data);
    });

    socket.on('gameCountdown', (data: { countdown: number }) => {
      setCountdown(data.countdown);
      let timeLeft = data.countdown;
      const countdownInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
          setCountdown(timeLeft);
        } else {
          setCountdown(null);
          clearInterval(countdownInterval);
        }
      }, 1000);
    });

    socket.on('notification', (data: { message: string; type: string }) => {
      setNotification({
        message: data.message,
        type: data.type
      });
      setTimeout(() => setNotification(null), 4000);
    });

    socket.on('gameOver', (data: any) => {
      setWinnerData(data);
      setShowWinner(true);
      setTimeout(() => {
        setShowWinner(false);
      }, 5000);
    });

    socket.on('coinsUpdated', (data: { practiceCoins: number; realCoins: number }) => {
      // Update localStorage
      localStorage.setItem('practiceCoins', String(data.practiceCoins));
      localStorage.setItem('realCoins', String(data.realCoins));
      
      // Also update old format for backwards compatibility
      if (gameMode === 'coins') {
        localStorage.setItem('userCoins', String(data.practiceCoins));
      } else {
        localStorage.setItem('cashBalance', String(data.realCoins));
      }
      
      // Show notification
      setNotification({
        message: `💰 Your balance has been updated!`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 3000);
    });

    socket.on('playerBet', () => {
      // Player bet event handled by other handlers
    });

    socket.on('playerFolded', (data: { playerId: string; playerName?: string; reason?: string }) => {
      if (data.reason === 'disconnected') {
        setNotification({
          message: `${data.playerName || 'Player'} disconnected`,
          type: 'warning'
        });
        setTimeout(() => setNotification(null), 3000);
      }
    });

    socket.on('playerLeft', (data: { playerId: string; playerName: string; reason: string }) => {
      setNotification({
        message: `${data.playerName} left the game`,
        type: 'info'
      });
      setTimeout(() => setNotification(null), 3000);
    });

    socket.on('kicked', (data: { reason: string; message: string }) => {
      console.log('🚫 Kicked from game:', data.reason, data.message);
      alert(data.message || 'You have been removed from the game.');
      window.location.href = '/dashboard';
    });

    // Listen for other player's cards (premium feature)
    socket.on('otherPlayerCards', (data: { playerId: string; cards: any[] }) => {
      console.log('👁️ Received other player\'s cards:', data);
      
      // Update table state to show the target player's cards
      if (tableState) {
        const updatedPlayers = tableState.players.map((player: any) => {
          if (player.id === data.playerId) {
            return {
              ...player,
              cardSet: player.cardSet ? {
                ...player.cardSet,
                cards: data.cards,
                closed: false, // Show cards face-up
              } : undefined,
            };
          }
          return player;
        });
        
        setTableState({
          ...tableState,
          players: updatedPlayers,
        });
      }
    });

    return () => {
      socket.off('turnTimer');
      socket.off('gameCountdown');
      socket.off('notification');
      socket.off('gameOver');
      socket.off('coinsUpdated');
      socket.off('playerBet');
      socket.off('playerFolded');
      socket.off('otherPlayerCards');
      socket.off('playerLeft');
      socket.off('kicked');
    };
  }, [socket]);

  if (!tableState) {
    return <div className="loading">Loading table...</div>;
  }

  // All players are equal - just show from current player's viewing perspective
  // Current player is shown at bottom with controls, others shown around table
  const allPlayers = tableState.players;

  // Find current player and organize others
  const currentPlayer = allPlayers.find(p => p.id === myPlayerId);
  const otherPlayers = allPlayers.filter(p => p.id !== myPlayerId);
  
  return (
    <div className="game-table">
      {/* Leave Button - Top Left */}
      <button className="btn-leave-game" onClick={handleLeaveGame} title="Leave Game">
        ← Leave Game
      </button>

      {/* Leave Game Confirmation Modal */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-content leave-modal">
            <div className="modal-header">
              <h2>⚠️ Leave Game?</h2>
            </div>
            <div className="modal-body">
              <p className="warning-text">Are you sure you want to leave the game?</p>
              <ul className="warning-list">
                <li>🃏 You will fold your hand</li>
                <li>👥 You will be removed from the game</li>
                <li>🚫 You cannot rejoin this round</li>
                <li>💰 Any bet you placed will be lost</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cancelLeaveGame}>
                Cancel
              </button>
              <button className="btn-confirm-leave" onClick={confirmLeaveGame}>
                Yes, Leave Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teen Patti Logo Watermark on Table */}
      <div className="table-logo">TEEN PATTI</div>
      
      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {showWinner && winnerData && (
        <div className="winner-overlay">
          <div className="winner-card">
            <h2>🏆 Winner!</h2>
            <h3>{winnerData.winner.playerInfo.userName}</h3>
            <p className="winner-hand">{winnerData.reason}</p>
            <p className="winner-chips">Won: {currencySymbol}{tableState.pot.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Pot Display - Center of Table */}
      <div className="pot-display">
        <div className="pot-amount">{currencySymbol}{tableState.pot.toLocaleString()}</div>
        <div className="pot-label">Pot</div>
      </div>

      {tableState.gameState === 'waiting' && countdown !== null && (
        <div className="countdown-overlay">
          <span className="countdown-text">Game starts in {countdown} seconds...</span>
        </div>
      )}
      {tableState.gameState === 'waiting' && countdown === null && (
        <div className="waiting-area">
          <h3>⏳ Waiting...</h3>
          <p>{tableState.playerCount} player(s)</p>
          {tableState.playerCount < 2 && (
            <p className="hint">Need 2+ players</p>
          )}
        </div>
      )}

      {/* Table Layout - Original Style */}
      <div className="table-layout">
        {/* Other Players - Top Row */}
        <div className="opponents-row">
          {otherPlayers.map((player, index) => {
            const showTimer = timerData?.playerId === player.id;
            return (
              <div key={player.id} className={`opponent-seat seat-${index}`}>
                <PlayerCard
                  player={player}
                  position={0}
                  showTimer={showTimer}
                  timeLeft={timerData?.timeLeft || 0}
                  isCurrentPlayer={false}
                  currencySymbol={currencySymbol}
                />
              </div>
            );
          })}
        </div>

        {/* Current Player - Bottom */}
        {currentPlayer && (
          <div className="current-player-area">
            <div className="current-player-seat">
              <PlayerCard
                player={currentPlayer}
                position={0}
                showTimer={timerData?.playerId === currentPlayer.id}
                timeLeft={timerData?.timeLeft || 0}
                isCurrentPlayer={true}
                currencySymbol={currencySymbol}
              />
              
              {/* See Cards Button */}
              {currentPlayer.cardSet && currentPlayer.cardSet.closed && tableState.gameState === 'betting' && (
                <button
                  className="btn-see-cards"
                  onClick={() => socket?.emit('seeCards', { tableId: tableState.id, playerId: myPlayerId })}
                >
                  👁️ See Cards
                </button>
              )}
            </div>

            {/* Betting Controls - Always Show for Current Player During Betting */}
            {tableState.gameState === 'betting' && (
              <div className="betting-controls-container">
                <BettingPanel
                  socket={socket}
                  tableState={tableState}
                  myPlayer={currentPlayer}
                  currencySymbol={currencySymbol}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GameTable;
