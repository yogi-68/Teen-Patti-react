import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { TableState, Player } from '../types/game.types';

interface BettingPanelProps {
  socket: Socket | null;
  tableState: TableState;
  myPlayer: Player;
}

function BettingPanel({ socket, tableState, myPlayer }: BettingPanelProps) {
  const [betAmount, setBetAmount] = useState(0);

  useEffect(() => {
    // Calculate minimum bet
    const isBlind = myPlayer.cardSet?.closed ?? true;
    let minBet: number;

    if (isBlind) {
      minBet = tableState.lastBlind ? tableState.lastBet : Math.ceil(tableState.lastBet / 2);
    } else {
      minBet = tableState.lastBlind ? tableState.lastBet * 2 : tableState.lastBet;
    }

    setBetAmount(Math.ceil(minBet));
  }, [tableState.lastBet, tableState.lastBlind, myPlayer.cardSet]);

  useEffect(() => {
    if (!socket) return;

    // Send current bet amount to server when it changes
    socket.emit('currentBetUpdate', { playerId: myPlayer.id, amount: betAmount });
  }, [betAmount, myPlayer.id, socket]);

  const handleBet = () => {
    if (!socket || !myPlayer.turn) return;
    if (betAmount > myPlayer.playerInfo.chips) {
      alert('Not enough chips!');
      return;
    }
    socket.emit('bet', { tableId: tableState.id, playerId: myPlayer.id, amount: betAmount });
  };

  const handleFold = () => {
    if (!socket || !myPlayer.turn) return;
    if (window.confirm('Are you sure you want to fold?')) {
      socket.emit('fold', { tableId: tableState.id, playerId: myPlayer.id });
    }
  };

  const handleShow = () => {
    if (!socket || !myPlayer.turn) return;
    if (window.confirm('Are you sure you want to show your cards?')) {
      socket.emit('show', { tableId: tableState.id, playerId: myPlayer.id });
    }
  };

  const isBlind = myPlayer.cardSet?.closed ?? true;
  const minBet = isBlind
    ? tableState.lastBlind
      ? tableState.lastBet
      : Math.ceil(tableState.lastBet / 2)
    : tableState.lastBlind
    ? tableState.lastBet * 2
    : tableState.lastBet;

  const maxBet = Math.min(myPlayer.playerInfo.chips, tableState.config.maxBet);

  return (
    <div className="betting-panel">
      {!myPlayer.turn ? (
        <div className="not-your-turn">
          <p>⏳ Waiting for your turn...</p>
        </div>
      ) : (
        <>
          <div className="bet-controls">
            <div className="bet-slider-group">
              <label htmlFor="betAmount">
                Bet Amount: <strong>{betAmount}</strong> chips
              </label>
              <input
                id="betAmount"
                type="range"
                min={minBet}
                max={maxBet}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                step={1}
              />
              <div className="bet-range">
                <span>Min: {minBet}</span>
                <span>Max: {maxBet}</span>
              </div>
            </div>

            <div className="bet-quick-buttons">
              <button onClick={() => setBetAmount(minBet)}>Min</button>
              <button onClick={() => setBetAmount(Math.ceil(minBet * 2))}>2x</button>
              <button onClick={() => setBetAmount(Math.ceil(minBet * 4))}>4x</button>
              <button onClick={() => setBetAmount(maxBet)}>All-in</button>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="btn-action btn-bet"
              onClick={handleBet}
              disabled={!myPlayer.turn || betAmount > myPlayer.playerInfo.chips}
            >
              {isBlind ? '🙈 Bet Blind' : '👁️ Bet Chaal'}
            </button>

            <button
              className="btn-action btn-fold"
              onClick={handleFold}
              disabled={!myPlayer.turn}
            >
              🃏 Fold
            </button>

            <button
              className="btn-action btn-show"
              onClick={handleShow}
              disabled={!myPlayer.turn || tableState.playerCount < 2}
            >
              🏆 Show
            </button>
          </div>

          <div className="betting-info">
            <p>
              You are playing <strong>{isBlind ? 'BLIND' : 'CHAAL'}</strong>
            </p>
            <p className="hint">
              {isBlind
                ? '💡 Click "See Cards" to see your hand and play Chaal'
                : '💡 Chaal bets are double the blind bets'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default BettingPanel;
