import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import PlayerCard from './PlayerCard.tsx';
import BettingPanel from './BettingPanel.tsx';
import PlayingCard from './PlayingCard.tsx';
import Timer from './Timer.tsx';

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

  const myPlayer = tableState.players.find((p) => p.id === myPlayerId);
  const otherPlayers = tableState.players.filter((p) => p.id !== myPlayerId);

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

      <div className="table-info">
        <div className="pot-display">
          <h3>💰 Pot</h3>
          <p className="pot-amount">{tableState.pot}</p>
        </div>
        <div className="game-status">
          <p>State: <strong>{tableState.gameState}</strong></p>
          <p>Players: <strong>{tableState.playerCount}/6</strong></p>
          <p>Round: <strong>{tableState.roundCount}</strong></p>
        </div>
        <div className="last-bet">
          <p>Last Bet: <strong>{tableState.lastBet}</strong></p>
          <p>Type: <strong>{tableState.lastBlind ? 'Blind' : 'Chaal'}</strong></p>
        </div>
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

      <div className="players-area">
        {otherPlayers.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            position={index}
            showTimer={timerData?.playerId === player.id}
            timeLeft={timerData?.timeLeft || 0}
          />
        ))}
      </div>

      {myPlayer && (
        <div className="my-area">
          <div className="my-info">
            <h3>{myPlayer.playerInfo.userName} (You)</h3>
            <p className="my-chips">💰 {myPlayer.playerInfo.chips} chips</p>
            {myPlayer.totalBet > 0 && (
              <p className="my-total-bet">Total Bet: {myPlayer.totalBet}</p>
            )}
          </div>

          <div className="my-cards">
            {myPlayer.cardSet && myPlayer.cardSet.cards.length > 0 ? (
              <>
                {myPlayer.cardSet.cards.map((card, index) => (
                  <PlayingCard
                    key={index}
                    card={card}
                    hidden={myPlayer.cardSet!.closed}
                  />
                ))}
                {myPlayer.cardSet.closed && tableState.gameState === 'betting' && (
                  <button
                    className="btn-secondary btn-see-cards"
                    onClick={() => socket?.emit('seeCards', { tableId: tableState.id, playerId: myPlayerId })}
                  >
                    See Cards
                  </button>
                )}
              </>
            ) : (
              <p className="no-cards">No cards dealt yet</p>
            )}
          </div>

          {myPlayer.turn && tableState.gameState === 'betting' && (
            <Timer
              playerId={myPlayer.id}
              timeLeft={timerData?.playerId === myPlayer.id ? timerData.timeLeft : 20}
            />
          )}

          {tableState.gameState === 'betting' && (
            <BettingPanel
              socket={socket}
              tableState={tableState}
              myPlayer={myPlayer}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default GameTable;
