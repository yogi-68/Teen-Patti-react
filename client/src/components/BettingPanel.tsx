import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { TableState, Player } from '../types/game.types';
import './BettingPanel.css';

interface BettingPanelProps {
  socket: Socket | null;
  tableState: TableState;
  myPlayer: Player;
  currencySymbol: string;
}

function BettingPanel({ socket, tableState, myPlayer, currencySymbol }: BettingPanelProps) {
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
      {/* Always show controls, just disable when not player's turn */}
      <>
          {/* Pack, Side Show, and Chaal - Bottom Left */}
          <div className="left-action-buttons">
            <button
              className={`btn-action btn-pack ${!myPlayer.turn ? 'disabled' : ''}`}
              onClick={handleFold}
              disabled={!myPlayer.turn}
            >
              <span className="btn-icon">🎁</span>
              <span className="btn-label">Pack</span>
            </button>

            <button
              className={`btn-action btn-show ${!myPlayer.turn ? 'disabled' : ''}`}
              onClick={handleShow}
              disabled={!myPlayer.turn || tableState.playerCount < 2}
            >
              <span className="btn-icon">👁️</span>
              <span className="btn-label">Side Show</span>
            </button>

            <button 
              className="btn-decrease-bet" 
              onClick={decreaseBet}
              disabled={betAmount <= minBet || !myPlayer.turn}
            >
              ➖
            </button>

            <button
              className={`btn-action btn-chaal ${!myPlayer.turn ? 'disabled' : ''}`}
              onClick={handleBet}
              disabled={!myPlayer.turn || betAmount > myPlayer.playerInfo.chips}
            >
              <span className="btn-icon">{currencySymbol}</span>
              <span className="btn-label">{isBlind ? 'Blind' : 'Chaal'}</span>
              <span className="bet-value-on-btn">{currencySymbol}{betAmount.toLocaleString()}</span>
            </button>

            <button 
              className="btn-increase-bet" 
              onClick={increaseBet}
              disabled={betAmount >= maxBet || !myPlayer.turn}
            >
              ➕
            </button>
          </div>


      </>
    </div>
  );
}

export default BettingPanel;
