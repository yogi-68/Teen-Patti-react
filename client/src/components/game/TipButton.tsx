import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { TableState } from '../../types/game.types';
import SoundManager from '../../utils/SoundManager';
import './TipButton.css';

interface TipButtonProps {
  socket: Socket | null;
  tableState: TableState;
  userId: string;
  gameMode: string;
  hasSeenCards: boolean;
  hasUsedJoker: boolean;
}

interface TipEvent {
  playerName: string;
  amount: number;
  timestamp: Date;
}

const TIP_AMOUNTS = [10, 20, 50, 100];

function TipButton({ socket, tableState, userId, gameMode, hasSeenCards, hasUsedJoker }: TipButtonProps) {
  const [balance, setBalance] = useState<number>(0);
  const [tipping, setTipping] = useState<boolean>(false);
  const [recentTips, setRecentTips] = useState<TipEvent[]>([]);
  const [showTipAnimation, setShowTipAnimation] = useState<boolean>(false);
  const [lastTipAmount, setLastTipAmount] = useState<number>(0);
  const [lastTipPlayer, setLastTipPlayer] = useState<string>('');

  // Get user balance
  useEffect(() => {
    const user = tableState.players?.find((p) => p.id === userId);
    if (user) {
      setBalance(user.chips || 0);
    }
  }, [tableState, userId]);

  // Listen for tip events
  useEffect(() => {
    if (!socket) return;

    const handleTipSuccess = (data: { amount: number; newBalance: number }) => {
      setTipping(false);
      setBalance(data.newBalance);
      SoundManager.playButtonClick();
    };

    const handleTipError = (data: { error: string }) => {
      setTipping(false);
      alert(data.error || 'Failed to send tip');
    };

    const handleBroadcastTip = (data: { playerName: string; amount: number; timestamp: Date }) => {
      setRecentTips((prev) => [
        {
          playerName: data.playerName,
          amount: data.amount,
          timestamp: new Date(data.timestamp),
        },
        ...prev.slice(0, 4), // Keep last 5 tips
      ]);

      // Show animation
      setLastTipAmount(data.amount);
      setLastTipPlayer(data.playerName);
      setShowTipAnimation(true);
      setTimeout(() => setShowTipAnimation(false), 3000);
    };

    const handleBalanceUpdate = (data: { balance: number; gameMode: string }) => {
      if (data.gameMode === gameMode) {
        setBalance(data.balance);
      }
    };

    socket.on('tip_success', handleTipSuccess);
    socket.on('tip_error', handleTipError);
    socket.on('broadcast_tip_event', handleBroadcastTip);
    socket.on('update_balance', handleBalanceUpdate);

    return () => {
      socket.off('tip_success', handleTipSuccess);
      socket.off('tip_error', handleTipError);
      socket.off('broadcast_tip_event', handleBroadcastTip);
      socket.off('update_balance', handleBalanceUpdate);
    };
  }, [socket, gameMode]);

  const handleTip = (amount: number) => {
    if (!socket || tipping) return;

    // Check balance
    if (balance < amount) {
      alert(`Insufficient balance. You have ${balance}, need ${amount}.`);
      return;
    }

    setTipping(true);

    socket.emit('player_tip', {
      tableId: tableState.id,
      playerId: userId,
      amount,
      gameMode,
      roundNumber: tableState.gameCount || 1,
    });

    SoundManager.playButtonClick();
  };

  // Only show in token mode
  if (gameMode !== 'token') {
    return null;
  }

  // Don't show if game not started
  if (tableState.gameState !== 'betting' && tableState.gameState !== 'showdown') {
    return null;
  }

  // Only show after player has seen their cards OR used Joker
  if (!hasSeenCards && !hasUsedJoker) {
    return null;
  }

  return (
    <div className="tip-button-container">
      <div className="tip-buttons">
        {TIP_AMOUNTS.map((amount) => (
          <button
            key={amount}
            className={`tip-btn tip-btn-${amount} ${balance < amount ? 'tip-disabled' : ''}`}
            onClick={() => handleTip(amount)}
            disabled={tipping || balance < amount}
            title={balance < amount ? `Need ${amount}` : `Tip ${amount}`}
          >
            <span className="tip-icon">💰</span>
            <span className="tip-amount">{amount}+</span>
          </button>
        ))}
      </div>

      {/* Tip Animation */}
      {showTipAnimation && (
        <div className="tip-animation">
          <div className="tip-coins">💰💰💰</div>
          <div className="tip-text">
            {lastTipPlayer} tipped {lastTipAmount}!
          </div>
        </div>
      )}

      {/* Recent Tips */}
      {recentTips.length > 0 && (
        <div className="recent-tips">
          <div className="recent-tips-header">Recent Tips</div>
          <div className="recent-tips-list">
            {recentTips.map((tip, index) => (
              <div key={index} className="recent-tip-item">
                <span className="tip-player">{tip.playerName}</span>
                <span className="tip-amount-small">💰 {tip.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TipButton;
