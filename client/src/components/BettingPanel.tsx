import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { TableState, Player } from '../types/game.types';
import './BettingPanel.css';

interface BettingPanelProps {
  socket: Socket | null;
  tableState: TableState;
  myPlayer: Player;
}

function BettingPanel({ socket, tableState, myPlayer }: BettingPanelProps) {
  const [betAmount, setBetAmount] = useState(0);

  // Calculate minimum bet based on last bet and blind status
  const getMinBet = () => {
    const isBlind = myPlayer.cardSet?.closed ?? true;
    if (isBlind) {
      return tableState.lastBlind ? tableState.lastBet : Math.ceil(tableState.lastBet / 2);
    } else {
      return tableState.lastBlind ? tableState.lastBet * 2 : tableState.lastBet;
    }
  };

  useEffect(() => {
    const minBet = getMinBet();
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
  const minBet = getMinBet();
  
  // Max bet is 2x the minimum (matching original logic)
  const maxAllowedBet = Math.min(minBet * 2, tableState.config.maxBet);
  const maxBet = Math.min(myPlayer.playerInfo.chips, maxAllowedBet);

  // Increase bet (double it, but don't exceed max)
  const increaseBet = () => {
    const newBet = betAmount * 2;
    if (newBet <= maxBet) {
      setBetAmount(newBet);
    }
  };

  // Decrease bet (half it, but don't go below min)
  const decreaseBet = () => {
    const newBet = Math.ceil(betAmount / 2);
    if (newBet >= minBet) {
      setBetAmount(newBet);
    }
  };

  return (
    <div className="betting-panel">
      {!myPlayer.turn ? (
        <div className="not-your-turn">
          <p>⏳ Waiting for your turn...</p>
        </div>
      ) : (
        <>
          <div className="bet-controls">
            <div className="bet-amount-display">
              <label>Bet Amount:</label>
              <div className="bet-amount-control">
                <button 
                  className="btn-decrease" 
                  onClick={decreaseBet}
                  disabled={betAmount <= minBet}
                >
                  -
                </button>
                <span className="bet-value">{betAmount}</span>
                <button 
                  className="btn-increase" 
                  onClick={increaseBet}
                  disabled={betAmount >= maxBet}
                >
                  +
                </button>
              </div>
              <div className="bet-range">
                <span>Min: {minBet}</span>
                <span>Max: {maxBet}</span>
              </div>
            </div>

            <div className="bet-slider-group">
              <input
                id="betAmount"
                type="range"
                min={minBet}
                max={maxBet}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                step={minBet}
              />
            </div>

            <div className="bet-quick-buttons">
              <button onClick={() => setBetAmount(minBet)}>Min</button>
              <button 
                onClick={() => setBetAmount(Math.min(Math.ceil(minBet * 2), maxBet))}
                disabled={minBet * 2 > maxBet}
              >
                2x
              </button>
              <button onClick={() => setBetAmount(maxBet)}>Max</button>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="btn-action btn-pack"
              onClick={handleFold}
              disabled={!myPlayer.turn}
            >
              <span className="btn-icon">🎁</span>
              <span className="btn-label">Pack</span>
            </button>

            <button
              className="btn-action btn-show"
              onClick={handleShow}
              disabled={!myPlayer.turn || tableState.playerCount < 2}
            >
              <span className="btn-icon">👁️</span>
              <span className="btn-label">Side Show</span>
            </button>

            <div className="bet-display-box">
              <span className="coin-icon">🪙</span>
              <span className="bet-amount-text">{betAmount} CR</span>
            </div>

            <button
              className="btn-action btn-chaal"
              onClick={handleBet}
              disabled={!myPlayer.turn || betAmount > myPlayer.playerInfo.chips}
            >
              <span className="btn-icon">🪙</span>
              <span className="btn-label">{isBlind ? 'Blind' : 'Chaal'}</span>
              <span className="bet-value-on-btn">{betAmount}</span>
            </button>
          </div>

          <div className="bet-increase-decrease">
            <button 
              className="btn-decrease-bet" 
              onClick={decreaseBet}
              disabled={betAmount <= minBet}
            >
              ➖
            </button>
            <button 
              className="btn-increase-bet" 
              onClick={increaseBet}
              disabled={betAmount >= maxBet}
            >
              ➕
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default BettingPanel;
