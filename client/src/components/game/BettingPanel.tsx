import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Socket } from 'socket.io-client';
import type { TableState, Player } from '../../types/game.types';
import SoundManager from '../../utils/SoundManager';
import './BettingPanel.css';

interface BettingPanelProps {
  socket: Socket | null;
  tableState: TableState;
  myPlayer: Player;
  currencySymbol: string;
}

const BettingPanel = memo(({ socket, tableState, myPlayer, currencySymbol }: BettingPanelProps) => {
  const [betAmount, setBetAmount] = useState(0);

  // Memoize min bet calculation
  const minBet = useMemo(() => {
    const isBlind = myPlayer.isBlind ?? true;
    if (isBlind) {
      return tableState.lastBlind ? tableState.lastBet : Math.ceil(tableState.lastBet / 2);
    } else {
      return tableState.lastBlind ? tableState.lastBet * 2 : tableState.lastBet;
    }
  }, [myPlayer.isBlind, tableState.lastBlind, tableState.lastBet]);

  // Memoize max bet
  const maxBet = useMemo(() => myPlayer.playerInfo.chips, [myPlayer.playerInfo.chips]);
  
  // Memoize blind status
  const isBlind = useMemo(() => myPlayer.isBlind ?? true, [myPlayer.isBlind]);

  useEffect(() => {
    setBetAmount(Math.ceil(minBet));
  }, [minBet]);

  useEffect(() => {
    if (!socket) return;

    // Send current bet amount to server when it changes
    socket.emit('currentBetUpdate', { playerId: myPlayer.id, amount: betAmount });
  }, [betAmount, myPlayer.id, socket]);

  const handleBet = useCallback(() => {
    SoundManager.playButtonClick();
    if (!socket || !myPlayer.turn) return;
    if (betAmount > myPlayer.playerInfo.chips) {
      alert('Not enough chips!');
      return;
    }
    socket.emit('bet', { tableId: tableState.id, playerId: myPlayer.id, amount: betAmount });
  }, [socket, myPlayer.turn, myPlayer.id, myPlayer.playerInfo.chips, betAmount, tableState.id]);

  const handleFold = useCallback(() => {
    SoundManager.playButtonClick();
    if (!socket || !myPlayer.turn) return;
    if (window.confirm('Are you sure you want to fold?')) {
      socket.emit('fold', { tableId: tableState.id, playerId: myPlayer.id });
    }
  }, [socket, myPlayer.turn, myPlayer.id, tableState.id]);

  const handleShow = useCallback(() => {
    SoundManager.playButtonClick();
    if (!socket || !myPlayer.turn) return;
    if (window.confirm('Are you sure you want to show your cards?')) {
      socket.emit('show', { tableId: tableState.id, playerId: myPlayer.id });
    }
  }, [socket, myPlayer.turn, myPlayer.id, tableState.id]);

  // Increase bet (double it, but don't exceed balance)
  const increaseBet = useCallback(() => {
    SoundManager.playButtonClick();
    const newBet = betAmount * 2;
    if (newBet <= maxBet) {
      setBetAmount(newBet);
    }
  }, [betAmount, maxBet]);

  // Decrease bet (half it, but don't go below min)
  const decreaseBet = useCallback(() => {
    SoundManager.playButtonClick();
    // Don't decrease if we're already at minimum
    if (betAmount <= minBet) {
      return;
    }
    
    const newBet = Math.ceil(betAmount / 2);
    
    // Don't allow going below minimum
    if (newBet < minBet) {
      return;
    }
    
    setBetAmount(newBet);
  }, [betAmount, minBet]);

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
              data-testid="btn-pack"
            >
              <span className="btn-icon">📦</span>
              <span className="btn-label">Pack</span>
            </button>

            <button 
              className={`btn-action btn-show ${!myPlayer.turn ? 'disabled' : ''}`}
              onClick={handleShow}
              disabled={!myPlayer.turn || tableState.playerCount < 2}
              data-testid="btn-show"
            >
              <span className="btn-icon">👁️</span>
              <span className="btn-label">Side Show</span>
            </button>            <button 
              className="btn-decrease-bet" 
              onClick={decreaseBet}
              disabled={betAmount <= minBet || !myPlayer.turn}
              data-testid="btn-decrease-bet"
            >
              ➖
            </button>

            <button
              className={`btn-action btn-chaal ${!myPlayer.turn ? 'disabled' : ''}`}
              onClick={handleBet}
              disabled={!myPlayer.turn || betAmount > myPlayer.playerInfo.chips}
              data-testid="btn-bet"
            >
              <span className="btn-icon">{currencySymbol}</span>
              <span className="btn-label">{isBlind ? 'Blind' : 'Chaal'}</span>
              <span className="bet-value-on-btn">{currencySymbol}{betAmount.toLocaleString()}</span>
            </button>

            <button 
              className="btn-increase-bet" 
              onClick={increaseBet}
              disabled={betAmount >= maxBet || !myPlayer.turn}
              data-testid="btn-increase-bet"
            >
              ➕
            </button>
          </div>


      </>
    </div>
  );
});

BettingPanel.displayName = 'BettingPanel';

export default BettingPanel;
