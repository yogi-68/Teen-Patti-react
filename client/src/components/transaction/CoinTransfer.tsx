import React, { useState } from 'react';
import SoundManager from '../../utils/SoundManager';
import './CoinTransfer.css';

interface CoinTransferProps {
  userId: string;
  realToken: number;
  hasMadeFirstDeposit: boolean;
  isSubscribed: boolean;
  onTransferComplete?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const CoinTransfer: React.FC<CoinTransferProps> = ({ 
  userId, 
  realToken, 
  hasMadeFirstDeposit,
  isSubscribed,
  onTransferComplete,
  isOpen,
  onClose
}) => {
  const [toUsername, setToUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  React.useEffect(() => {
    if (isOpen) {
      checkPinStatus();
      if (showHistory) {
        fetchTransferHistory();
      }
    }
  }, [isOpen, userId, showHistory]);

  const checkPinStatus = async () => {
    if (!isSubscribed) {
      setHasPin(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/users/${userId}/transfer-pin-status`);
      const data = await response.json();
      setHasPin(data.hasPin && data.isSubscribed);
    } catch (error) {
      console.error('Error checking PIN status:', error);
      setHasPin(false);
    }
  };

  const fetchTransferHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/transfer-history`);
      const data = await response.json();
      setTransferHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching transfer history:', error);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showPinInput) {
      // First step: validate inputs
      if (!toUsername.trim()) {
        setMessage({ type: 'error', text: 'Please enter a username' });
        return;
      }

      const transferAmount = parseFloat(amount);
      
      if (isNaN(transferAmount) || transferAmount <= 0) {
        setMessage({ type: 'error', text: 'Please enter a valid amount' });
        return;
      }

      if (transferAmount > realToken) {
        setMessage({ type: 'error', text: `Insufficient balance. You have ₹${realToken}` });
        return;
      }

      if (!isSubscribed) {
        setMessage({ 
          type: 'error', 
          text: 'Token transfers are only available for subscribed users' 
        });
        return;
      }

      if (!hasPin) {
        setMessage({ 
          type: 'error', 
          text: 'You need a transfer PIN. Contact support to get your PIN.' 
        });
        return;
      }

      setShowPinInput(true);
      setMessage(null);
      return;
    }

    // Second step: process transfer with PIN
    if (pin.length !== 4) {
      setMessage({ type: 'error', text: 'Please enter your 4-digit PIN' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const transferAmount = parseFloat(amount);
      const response = await fetch(`${API_URL}/users/transfer-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUserId: userId,
          toUsername: toUsername.trim(),
          amount: transferAmount,
          pin: pin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      // Play coin sound on successful transfer
      SoundManager.playCoinSound();
      
      setMessage({ 
        type: 'success', 
        text: `Successfully transferred ₹${transferAmount} to ${toUsername}!` 
      });
      
      setToUsername('');
      setAmount('');
      setPin('');
      setShowPinInput(false);
      
      // Update local storage with new balance
      localStorage.setItem('realToken', String(data.newBalance));
      
      // Refresh history
      fetchTransferHistory();
      
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
        text: error instanceof Error ? error.message : 'Failed to transfer tokens' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="transfer-overlay" onClick={onClose}>
      <div className="coin-transfer" onClick={(e) => e.stopPropagation()}>
        <div className="transfer-header">
          <h3>🔐 Token Transfer</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="transfer-tabs">
          <button
            className={`tab-btn ${!showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(false)}
          >
            💸 Transfer
          </button>
          <button
            className={`tab-btn ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(true)}
          >
            📜 History
          </button>
        </div>

        {!showHistory ? (
          <>
            <p className="transfer-balance">Available: ₹{realToken}</p>

            {!isSubscribed && (
              <div className="transfer-warning subscription">
                <span className="warning-icon">⚠️</span>
                <div className="warning-text">
                  <strong>Subscription Required</strong>
                  <p>Token transfers are only available for subscribed users</p>
                </div>
              </div>
            )}

            {isSubscribed && !hasPin && (
              <div className="transfer-warning">
                <span className="warning-icon">⚠️</span>
                <div className="warning-text">
                  <strong>PIN Required</strong>
                  <p>Contact support to get your transfer PIN</p>
                </div>
              </div>
            )}

            <form onSubmit={handleTransfer} className="transfer-form">
              <div className="form-group-inline">
                <div className="form-field">
                  <label htmlFor="toUsername">👤 Recipient Username</label>
                  <input
                    type="text"
                    id="toUsername"
                    value={toUsername}
                    onChange={(e) => setToUsername(e.target.value)}
                    placeholder="Enter username"
                    disabled={!isSubscribed || !hasPin || loading || showPinInput}
                    required
                  />
                </div>
              </div>

              <div className="form-group-inline">
                <div className="form-field">
                  <label htmlFor="amount">💰 Amount</label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    max={realToken}
                    step="0.01"
                    disabled={!isSubscribed || !hasPin || loading || showPinInput}
                    required
                  />
                </div>
              </div>

              {showPinInput && (
                <div className="form-group-inline">
                  <div className="form-field">
                    <label htmlFor="pin">🔐 Enter 4-Digit PIN</label>
                    <input
                      type="password"
                      id="pin"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="****"
                      maxLength={4}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="quick-amounts">
                {[100, 500, 1000, 5000].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => setAmount(String(Math.min(quickAmount, realToken)))}
                    disabled={!isSubscribed || !hasPin || loading || showPinInput || realToken < 1}
                  >
                    ₹{quickAmount}
                  </button>
                ))}
              </div>

              {message && (
                <div className={`transfer-message ${message.type}`}>
                  <span className="message-icon">
                    {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}
                  </span>
                  <span>{message.text}</span>
                </div>
              )}

              <div className="button-group">
                {showPinInput && (
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowPinInput(false);
                      setPin('');
                      setMessage(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  className="transfer-btn"
                  disabled={!isSubscribed || !hasPin || loading || !toUsername || !amount}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : showPinInput ? (
                    <>
                      <span>✅</span>
                      Confirm Transfer
                    </>
                  ) : (
                    <>
                      <span>➡️</span>
                      Continue
                    </>
                  )}
                </button>
              </div>

              <div className="security-notice">
                <p>🔒 Transfers are secured with your personal PIN</p>
                <p>⚠️ All transfers are final and cannot be reversed</p>
              </div>
            </form>
          </>
        ) : (
          <div className="transfer-history">
            <h3>Transfer History</h3>
            {transferHistory.length === 0 ? (
              <div className="empty-state">
                <p>📭 No transfer history yet</p>
              </div>
            ) : (
              <div className="history-list">
                {transferHistory.map((transfer, index) => (
                  <div key={index} className={`history-item ${transfer.type}`}>
                    <div className="history-icon">
                      {transfer.type === 'sent' ? '📤' : '📥'}
                    </div>
                    <div className="history-details">
                      <div className="history-user">
                        {transfer.type === 'sent' ? `To: ${transfer.toUsername}` : `From: ${transfer.fromUsername}`}
                      </div>
                      <div className="history-date">{new Date(transfer.timestamp).toLocaleString()}</div>
                    </div>
                    <div className={`history-amount ${transfer.type}`}>
                      {transfer.type === 'sent' ? '-' : '+'}₹{transfer.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinTransfer;
