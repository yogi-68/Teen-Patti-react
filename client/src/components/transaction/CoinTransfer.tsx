import React, { useState } from 'react';
import './CoinTransfer.css';

interface CoinTransferProps {
  userId: string;
  realCoins: number;
  hasMadeFirstDeposit: boolean;
  onTransferComplete?: () => void;
}

const CoinTransfer: React.FC<CoinTransferProps> = ({ 
  userId, 
  realCoins, 
  hasMadeFirstDeposit,
  onTransferComplete 
}) => {
  const [toUsername, setToUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!toUsername.trim()) {
      setMessage({ type: 'error', text: 'Please enter a username' });
      return;
    }

    const transferAmount = parseFloat(amount);
    
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (transferAmount > realCoins) {
      setMessage({ type: 'error', text: `Insufficient balance. You have ₹${realCoins}` });
      return;
    }

    if (!hasMadeFirstDeposit) {
      setMessage({ 
        type: 'error', 
        text: 'Transfer service is only available after your first deposit' 
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUserId: userId,
          toUsername: toUsername.trim(),
          amount: transferAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      setMessage({ 
        type: 'success', 
        text: `Successfully transferred ₹${transferAmount} to ${toUsername}!` 
      });
      
      setToUsername('');
      setAmount('');
      
      // Update local storage with new balance
      localStorage.setItem('realCoins', String(data.newBalance));
      
      // Call callback if provided
      if (onTransferComplete) {
        onTransferComplete();
      }

      // Trigger balance update event
      window.dispatchEvent(new Event('balanceUpdated'));

    } catch (error) {
      console.error('Transfer error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to transfer coins' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="coin-transfer">
      <div className="transfer-header">
        <h3>💸 Transfer Coins</h3>
        <p className="transfer-balance">Available: ₹{realCoins}</p>
      </div>

      {!hasMadeFirstDeposit && (
        <div className="transfer-warning">
          <span className="warning-icon">⚠️</span>
          <div className="warning-text">
            <strong>Transfer Locked</strong>
            <p>Make your first deposit to unlock coin transfers</p>
          </div>
        </div>
      )}

      <form onSubmit={handleTransfer} className="transfer-form">
        <div className="form-group">
          <label htmlFor="toUsername">
            <span className="label-icon">👤</span>
            Recipient Username
          </label>
          <input
            type="text"
            id="toUsername"
            value={toUsername}
            onChange={(e) => setToUsername(e.target.value)}
            placeholder="Enter username"
            disabled={!hasMadeFirstDeposit || loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">
            <span className="label-icon">💰</span>
            Amount
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            max={realCoins}
            step="0.01"
            disabled={!hasMadeFirstDeposit || loading}
            required
          />
          <div className="quick-amounts">
            {[100, 500, 1000, 5000].map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                className="quick-amount-btn"
                onClick={() => setAmount(String(Math.min(quickAmount, realCoins)))}
                disabled={!hasMadeFirstDeposit || loading || realCoins < 1}
              >
                ₹{quickAmount}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className={`transfer-message ${message.type}`}>
            <span className="message-icon">
              {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>{message.text}</span>
          </div>
        )}

        <button 
          type="submit" 
          className="transfer-btn"
          disabled={!hasMadeFirstDeposit || loading || !toUsername || !amount}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            <>
              <span>💸</span>
              Send Coins
            </>
          )}
        </button>
      </form>

      <div className="transfer-info">
        <div className="info-item">
          <span className="info-icon">🔒</span>
          <span>Secure transfer system</span>
        </div>
        <div className="info-item">
          <span className="info-icon">⚡</span>
          <span>Instant delivery</span>
        </div>
        <div className="info-item">
          <span className="info-icon">📝</span>
          <span>Transaction history tracked</span>
        </div>
      </div>
    </div>
  );
};

export default CoinTransfer;
