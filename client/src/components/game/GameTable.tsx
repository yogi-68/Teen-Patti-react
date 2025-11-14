import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { useGameStore } from '../../store/gameStore';
import PlayerCard from './PlayerCard.tsx';
import BettingPanel from './BettingPanel.tsx';
import JokerButton from './JokerButton.tsx';
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
  const [hasActivatedJoker, setHasActivatedJoker] = useState(false);
  const [jokerActivePlayers, setJokerActivePlayers] = useState<Set<string>>(new Set());
  const [jokerRevealedCards, setJokerRevealedCards] = useState<Record<string, any[]>>({});

  const [countdown, setCountdown] = useState<number | null>(null);

  // Currency symbol based on game mode
  const currencySymbol = gameMode === 'coins' ? '🪙' : '₹';

  // Handle leave game - show modal
  const handleLeaveGame = () => {
    setShowLeaveModal(true);
  };

  // Confirm leave game
  const confirmLeaveGame = () => {
    // Emit removePlayer event to properly leave the table
    if (socket && tableState) {
      socket.emit('removePlayer', { 
        tableId: tableState.id, 
        playerId: myPlayerId,
        reason: 'intentional_leave'
      });
      
      // Don't disconnect socket - keep it connected for future games
      // The server will handle removing the player from the table
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

  // Re-apply Joker revealed cards whenever table state updates
  useEffect(() => {
    if (!tableState || !myPlayerId) return;
    
    // If Joker is not active but we have revealed cards, clear them
    if (!jokerActivePlayers.has(myPlayerId) && Object.keys(jokerRevealedCards).length > 0) {
      console.log('🧹 Clearing stale Joker revealed cards - Joker no longer active');
      setJokerRevealedCards({});
      return;
    }
    
    // If we're in a new game (not BETTING or FINISHED), clear all Joker state
    if (tableState.gameState !== 'betting' && tableState.gameState !== 'finished') {
      if (Object.keys(jokerRevealedCards).length > 0 || jokerActivePlayers.size > 0) {
        console.log('🧹 New game starting - clearing all Joker state');
        setJokerRevealedCards({});
        setJokerActivePlayers(new Set());
        setHasActivatedJoker(false);
      }
      return;
    }
    
    if (Object.keys(jokerRevealedCards).length === 0) return;
    
    // Only re-apply if current player has Joker active
    if (!jokerActivePlayers.has(myPlayerId)) return;
    
    // Only re-apply during active gameplay (BETTING state)
    if (tableState.gameState !== 'betting') return;

    // Check if any player has placeholder cards that should have real cards
    const needsUpdate = tableState.players.some(player => {
      if (jokerRevealedCards[player.id]) {
        const hasPlaceholder = player.cardSet?.cards?.some((card: any) => 
          card.type === 'hidden' || card.rank === 'hidden'
        );
        // Only update if cards are placeholders (not real cards from new game)
        const currentCards = player.cardSet?.cards || [];
        const revealedCards = jokerRevealedCards[player.id] || [];
        
        // Check if the revealed cards are actually different (not just placeholder vs real)
        // If current cards are real but different from revealed, it means NEW game - don't apply old cards
        if (!hasPlaceholder && currentCards.length > 0 && 
            (currentCards[0] as any).type !== 'hidden' && 
            (currentCards[0].rank !== revealedCards[0]?.rank || currentCards[0].type !== revealedCards[0]?.type)) {
          console.log('⚠️ Detected new game - clearing old Joker cards');
          setJokerRevealedCards({}); // Clear old cards
          return false; // Don't apply - these are NEW game cards
        }
        
        return hasPlaceholder;
      }
      return false;
    });

    if (needsUpdate) {
      console.log('🔄 Re-applying Joker revealed cards after table update');
      const updatedPlayers = tableState.players.map(player => {
        if (jokerRevealedCards[player.id]) {
          return {
            ...player,
            cardSet: {
              ...player.cardSet,
              cards: jokerRevealedCards[player.id],
              closed: player.cardSet?.closed ?? true
              // DON'T change 'closed' - that's for whether the player themselves has seen their cards
              // viewerHasJoker prop in PlayerCard handles showing cards to Joker users
            }
          };
        }
        return player;
      });
      setTableState({ ...tableState, players: updatedPlayers });
    }
  }, [tableState?.players, tableState?.gameState, jokerRevealedCards, jokerActivePlayers, myPlayerId, setTableState]);

  useEffect(() => {
    if (!socket) return;

    // If we have a playerId but no tableState, request the current table state
    if (myPlayerId && !tableState && socket.connected) {
      // The tableUpdate should come automatically, but this ensures we get it
      socket.emit('requestTableState', { playerId: myPlayerId });
    }

    // Handle socket disconnection
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected. Reason:', reason);
      setNotification({
        message: 'Connection lost. Attempting to reconnect...',
        type: 'error'
      });
      
      // Auto-reconnect if server forced disconnect
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    // Handle reconnection
    socket.on('connect', () => {
      console.log('✅ Socket connected');
      // Don't automatically rejoin - let the user go through normal join flow
      // The server will handle reconnection if they join within grace period
      if (tableState && myPlayerId) {
        console.log('📡 Socket reconnected while in game - waiting for tableUpdate');
      }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setNotification({
        message: 'Connection error. Please check your internet.',
        type: 'error'
      });
    });

    // Heartbeat - send ping every 25 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 25000);

    socket.on('turnTimer', (data: { playerId: string; timeLeft: number }) => {
      setTimerData(data);
    });

    socket.on('gameCountdown', (data: { countdown: number }) => {
      setCountdown(data.countdown);
      // Server now handles the countdown ticker, just display the value
      if (data.countdown <= 0) {
        setCountdown(null);
        // Reset Joker state when new game starts
        setHasActivatedJoker(false);
        setJokerActivePlayers(new Set());
        setJokerRevealedCards({}); // Clear revealed cards
        
        // Reset card visibility for all players when new game starts
        if (tableState) {
          const updatedPlayers = tableState.players.map(player => ({
            ...player,
            cardSet: player.cardSet ? {
              ...player.cardSet,
              closed: true
            } : player.cardSet
          }));
          setTableState({ ...tableState, players: updatedPlayers });
        }
      }
    });

    // Reset Joker state when a new game starts
    socket.on('gameStarted', (newTableState: any) => {
      console.log('🎮 New game started - resetting Joker state and See Cards');
      setHasActivatedJoker(false);
      setJokerActivePlayers(new Set());
      setJokerRevealedCards({}); // Clear revealed cards
      if (newTableState) {
        console.log('📊 New table state received:', {
          gameState: newTableState.gameState,
          players: newTableState.allPlayers?.map((p: any) => ({
            id: p.id,
            name: p.playerInfo?.userName,
            cardSetClosed: p.cardSet?.closed
          }))
        });
        
        // IMPORTANT: Ensure all cards are marked as closed for new game
        // Server should send this, but we enforce it client-side as well
        const stateWithClosedCards = {
          ...newTableState,
          players: newTableState.players?.map((p: any) => ({
            ...p,
            cardSet: p.cardSet ? {
              ...p.cardSet,
              closed: true  // Force cards to be closed for new game
            } : p.cardSet
          }))
        };
        
        setTableState(stateWithClosedCards);
        console.log('✅ All cards reset to closed state for new game');
      }
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
      
      // Clear ALL Joker state when game ends - MUST clear jokerActivePlayers FIRST
      // to prevent viewerHasJoker from being true when placeholder cards arrive
      console.log('🏁 Game over - clearing ALL Joker state');
      setHasActivatedJoker(false);
      setJokerActivePlayers(new Set());
      setJokerRevealedCards({});
      
      // Reset all cards to closed state after game ends
      if (tableState) {
        const updatedPlayers = tableState.players.map(player => ({
          ...player,
          cardSet: player.cardSet ? {
            ...player.cardSet,
            closed: true
          } : player.cardSet
        }));
        setTableState({ ...tableState, players: updatedPlayers });
      }
      
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

    socket.on('playerTimeout', (data: { playerId: string; playerName: string; message: string }) => {
      setNotification({
        message: `⏰ ${data.playerName} ${data.message}`,
        type: 'warning'
      });
      setTimeout(() => setNotification(null), 3000);
    });

    socket.on('playerLeft', (data: { playerId: string; playerName: string; reason: string }) => {
      setNotification({
        message: `${data.playerName} left the game`,
        type: 'info'
      });
      setTimeout(() => setNotification(null), 3000);
    });

    socket.on('kicked', (data: { reason: string; message: string }) => {
      alert(data.message || 'You have been removed from the game.');
      window.location.href = '/dashboard';
    });

    socket.on('removedFromTable', (data: { success: boolean; message: string }) => {
      if (data.success) {
        alert(data.message || 'You have left the table.');
        window.location.href = '/game';
      }
    });

    // Joker socket listeners
    socket.on('joker:activated', (data: { playerId: string; playerName: string; totalJokerUsers: number }) => {
      if (data && data.playerId && data.playerName) {
        setJokerActivePlayers(prev => new Set(prev).add(data.playerId));
        
        setNotification({
          message: `🃏 ${data.playerName} activated Joker! (${data.totalJokerUsers || 0} Joker users)`,
          type: 'info'
        });
        setTimeout(() => setNotification(null), 4000);
      }
    });

    socket.on('joker:cards-revealed', (data: { visibleCards: Record<string, any[]>; jokerUserIds: string[] }) => {
      // Store revealed cards for Joker users
      if (myPlayerId && data && data.jokerUserIds && data.visibleCards && data.jokerUserIds.includes(myPlayerId)) {
        console.log(`🃏 Joker cards revealed! Showing ${Object.keys(data.visibleCards).length} players' cards to you`);
        console.log('📋 Visible cards data:', Object.keys(data.visibleCards).map(pid => ({
          playerId: pid,
          cards: data.visibleCards[pid].map((c: any) => `${c.rank}${c.type}`)
        })));
        
        // Store the revealed cards separately to preserve them across table updates
        setJokerRevealedCards(data.visibleCards);
        console.log('✅ Joker revealed cards stored - will be applied to table state');
        
        // Get the CURRENT table state (not from closure)
        const currentState = useGameStore.getState().tableState;
        if (currentState) {
          console.log('🔍 Applying Joker cards to', currentState.players.length, 'players in current state');
          
          const updatedPlayers = currentState.players.map(player => {
            if (data.visibleCards[player.id]) {
              console.log('  ✓ Updating cards for player:', player.id, player.playerInfo.userName);
              return {
                ...player,
                cardSet: {
                  ...player.cardSet,
                  cards: data.visibleCards[player.id],
                  closed: player.cardSet?.closed ?? true
                }
              };
            }
            return player;
          });
          
          console.log('✅ Updated', updatedPlayers.length, 'players with Joker cards');
          setTableState({ ...currentState, players: updatedPlayers });
        }
      }
    });

    socket.on('joker:winner', (data: { winnerId: string; winnerName: string; hand: string; amount: number }) => {
      if (data && data.winnerName && data.hand !== undefined && data.amount !== undefined) {
        setNotification({
          message: `🏆 Joker Winner: ${data.winnerName} (${data.hand}) - Won ${currencySymbol}${data.amount}`,
          type: 'success'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    });

    socket.on('joker:fee-applied', (data: { winnerId: string; winnerName: string; feeAmount: number; remainingAmount: number }) => {
      if (data && data.winnerId === myPlayerId && data.feeAmount !== undefined && data.remainingAmount !== undefined) {
        setNotification({
          message: `⚠️ Joker fee applied: -${currencySymbol}${data.feeAmount.toFixed(2)} (30% fee). You received ${currencySymbol}${data.remainingAmount.toFixed(2)}`,
          type: 'warning'
        });
        setTimeout(() => setNotification(null), 6000);
      }
    });

    socket.on('joker:error', (data: { error: string }) => {
      if (data && data.error) {
        console.error('🃏 Joker error:', data.error);
        setNotification({
          message: `❌ Joker Error: ${data.error}`,
          type: 'error'
        });
        setTimeout(() => setNotification(null), 4000);
      }
    });

    return () => {
      clearInterval(heartbeatInterval);
      socket.off('disconnect');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('turnTimer');
      socket.off('gameCountdown');
      socket.off('gameStarted');
      socket.off('notification');
      socket.off('gameOver');
      socket.off('coinsUpdated');
      socket.off('playerBet');
      socket.off('playerFolded');
      socket.off('playerLeft');
      socket.off('kicked');
      socket.off('removedFromTable');
      socket.off('joker:activated');
      socket.off('joker:cards-revealed');
      socket.off('joker:winner');
      socket.off('joker:fee-applied');
      socket.off('joker:error');
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
  
  // Debug log for See Cards button visibility
  if (import.meta.env.DEV && currentPlayer) {
    console.log('🔍 See Cards Debug:', {
      hasCardSet: !!currentPlayer.cardSet,
      closed: currentPlayer.cardSet?.closed,
      gameState: tableState.gameState,
      buttonShouldShow: !!(currentPlayer.cardSet && currentPlayer.cardSet.closed && tableState.gameState === 'betting')
    });
  }
  
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

      {(tableState.gameState === 'waiting' || tableState.gameState === 'finished') && countdown !== null && countdown > 0 && !showWinner && (
        <div className="countdown-overlay">
          <span className="countdown-text">
            {tableState.gameState === 'finished' ? 'Next game starts in ' : 'Game starts in '}
            {countdown} {countdown === 1 ? 'second' : 'seconds'}...
          </span>
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
            const isJokerActive = jokerActivePlayers.has(player.id);
            const viewerHasJoker = myPlayerId ? jokerActivePlayers.has(myPlayerId) : false;
            return (
              <div 
                key={player.id} 
                className={`opponent-seat seat-${index} ${isJokerActive ? 'joker-active' : ''}`}
              >
                <PlayerCard
                  player={player}
                  position={0}
                  showTimer={showTimer}
                  timeLeft={timerData?.timeLeft || 0}
                  isCurrentPlayer={false}
                  currencySymbol={currencySymbol}
                  isJokerUser={isJokerActive}
                  viewerHasJoker={viewerHasJoker}
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
                isJokerUser={jokerActivePlayers.has(currentPlayer.id)}
                viewerHasJoker={jokerActivePlayers.has(currentPlayer.id)}
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
              
              {/* Debug: Show why See Cards is not visible */}
              {import.meta.env.DEV && currentPlayer.cardSet && !currentPlayer.cardSet.closed && tableState.gameState === 'betting' && (
                <div style={{ color: 'red', fontSize: '10px' }}>
                  Debug: Cards already seen (closed={currentPlayer.cardSet.closed?.toString()})
                </div>
              )}

              {/* Joker Button - Only show during active gameplay */}
              {tableState.gameState === 'betting' && myPlayerId && currentPlayer && (
                <JokerButton
                  userId={myPlayerId}
                  tableType={gameMode === 'coins' ? 'demo' : 'cash'}
                  hasActivated={hasActivatedJoker}
                  onActivate={() => {
                    if (socket && tableState && currentPlayer.cardSet) {
                      socket.emit('joker:activate', {
                        gameId: `table_${tableState.id}`,
                        userId: myPlayerId,
                        username: currentPlayer.playerInfo.userName,
                        tableType: gameMode === 'coins' ? 'demo' : 'cash',
                        cards: currentPlayer.cardSet.cards
                      });
                      setHasActivatedJoker(true);
                    }
                  }}
                  disabled={hasActivatedJoker}
                />
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
