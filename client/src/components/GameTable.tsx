import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import PlayerCard from './PlayerCard.tsx';
import BettingPanel from './BettingPanel.tsx';
import TableInfo from './TableInfo.tsx';
import './GameTable.css';

interface GameTableProps {
  socket: Socket | null;
}

function GameTable({ socket }: GameTableProps) {
  const { tableState, myPlayerId } = useGameStore();
  const [timerData, setTimerData] = useState<{ playerId: string; timeLeft: number } | null>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('turnTimer', (data: { playerId: string; timeLeft: number }) => {
      setTimerData(data);
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

    socket.on('playerFolded', (data: { playerId: string }) => {
      console.log(`Player ${data.playerId} folded`);
    });

    return () => {
      socket.off('turnTimer');
      socket.off('gameOver');
      socket.off('playerBet');
      socket.off('playerFolded');
    };
  }, [socket]);

  const handleStartGame = () => {
    if (!socket || !tableState) return;
    socket.emit('startGame', { tableId: tableState.id });
  };

  if (!tableState) {
    return <div className="loading">Loading table...</div>;
  }

  // All players are equal - just show from current player's viewing perspective
  // Current player is shown at bottom with controls, others shown around table
  const allPlayers = tableState.players;
  
  const canStartGame = 
    tableState.gameState === 'waiting' && 
    tableState.playerCount >= 2;

  return (
    <div className="game-table">
      {showWinner && winnerData && (
        <div className="winner-overlay">
          <div className="winner-card">
            <h2>🏆 Winner!</h2>
            <h3>{winnerData.winner.playerInfo.userName}</h3>
            <p className="winner-hand">{winnerData.reason}</p>
            <p className="winner-chips">Won: {tableState.pot} chips</p>
          </div>
        </div>
      )}

      <TableInfo table={tableState} />

      <div className="last-action-info">
        <span className="action-label">Last Bet:</span>
        <span className="action-value">${tableState.lastBet}</span>
        <span className="action-type">{tableState.lastBlind ? '🙈 Blind' : '👁️ Chaal'}</span>
      </div>

      {tableState.gameState === 'waiting' && (
        <div className="waiting-area">
          <h3>Waiting for players...</h3>
          <p>{tableState.playerCount} player(s) at the table</p>
          {canStartGame && (
            <button className="btn-primary btn-large" onClick={handleStartGame}>
              Start Game
            </button>
          )}
          {tableState.playerCount < 2 && (
            <p className="hint">Need at least 2 players to start</p>
          )}
        </div>
      )}

      {/* All players shown equally around the table */}
      <div className="players-circle">
        {allPlayers.map((player, index) => {
          const isCurrentPlayer = player.id === myPlayerId;
          const showTimer = timerData?.playerId === player.id;
          
          return (
            <div 
              key={player.id} 
              className={`player-seat seat-${index} ${isCurrentPlayer ? 'current-player' : 'other-player'}`}
            >
              <PlayerCard
                player={player}
                position={index}
                showTimer={showTimer}
                timeLeft={timerData?.timeLeft || 0}
                isCurrentPlayer={isCurrentPlayer}
              />
              
              {/* Show "See Cards" button for current player with hidden cards */}
              {isCurrentPlayer && player.cardSet && player.cardSet.closed && tableState.gameState === 'betting' && (
                <button
                  className="btn-secondary btn-see-cards"
                  onClick={() => socket?.emit('seeCards', { tableId: tableState.id, playerId: myPlayerId })}
                >
                  👁️ See Cards
                </button>
              )}

              {/* Show betting controls for current player's turn */}
              {isCurrentPlayer && player.turn && tableState.gameState === 'betting' && (
                <BettingPanel
                  socket={socket}
                  tableState={tableState}
                  myPlayer={player}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GameTable;
