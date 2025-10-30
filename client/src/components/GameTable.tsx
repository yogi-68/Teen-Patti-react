import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import PlayerCard from './PlayerCard.tsx';
import BettingPanel from './BettingPanel.tsx';
import './GameTable.css';

interface GameTableProps {
  socket: Socket | null;
}

function GameTable({ socket }: GameTableProps) {
  const { tableState, myPlayerId } = useGameStore();
  const [timerData, setTimerData] = useState<{ playerId: string; timeLeft: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('turnTimer', (data: { playerId: string; timeLeft: number }) => {
      setTimerData(data);
    });

    socket.on('gameCountdown', (data: { countdown: number }) => {
      console.log(`⏳ Game starting in ${data.countdown} seconds...`);
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

    socket.on('playerBet', (data: { playerId: string; amount: number; isBlind: boolean }) => {
      console.log(`Player ${data.playerId} bet ${data.amount} (${data.isBlind ? 'blind' : 'chaal'})`);
    });

    socket.on('playerFolded', (data: { playerId: string; playerName?: string; reason?: string }) => {
      if (data.reason === 'disconnected') {
        console.log(`⚠️ Player ${data.playerName || data.playerId} disconnected and auto-folded`);
        setNotification({
          message: `${data.playerName || 'Player'} disconnected`,
          type: 'warning'
        });
        setTimeout(() => setNotification(null), 3000);
      } else {
        console.log(`Player ${data.playerId} folded`);
      }
    });

    socket.on('playerLeft', (data: { playerId: string; playerName: string; reason: string }) => {
      console.log(`🚪 Player ${data.playerName} left the game (${data.reason})`);
      setNotification({
        message: `${data.playerName} left the game`,
        type: 'info'
      });
      setTimeout(() => setNotification(null), 3000);
    });

    return () => {
      socket.off('turnTimer');
      socket.off('gameCountdown');
      socket.off('notification');
      socket.off('gameOver');
      socket.off('playerBet');
      socket.off('playerFolded');
      socket.off('playerLeft');
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
            <p className="winner-chips">Won: ${tableState.pot}</p>
          </div>
        </div>
      )}

      {/* Pot Display - Center of Table */}
      <div className="pot-display">
        <div className="pot-amount">${tableState.pot}</div>
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
