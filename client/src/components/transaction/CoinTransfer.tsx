import React, { useState, useEffect } from 'react';
import SoundManager from '../../utils/SoundManager';
import './CoinTransfer.css';

interface CoinTransferProps {
  userId: string;
  realToken: number;
  isSubscribed: boolean;
  onTransferComplete?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const CoinTransfer: React.FC<CoinTransferProps> = ({ 
  userId, 
  realToken, 
  isSubscribed,
  onTransferComplete,
  isOpen,
  onClose
}) => {
  // IMPORTANT: ALL HOOKS MUST BE AT THE TOP - NO EARLY RETURNS BEFORE HOOKS
  const [toUsername, setToUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pinCheckComplete, setPinCheckComplete] = useState(false);
  const [hasShownPinPrompt, setHasShownPinPrompt] = useState(false);
  const [pinCreatedSuccessfully, setPinCreatedSuccessfully] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔐 CoinTransfer modal opened - resetting state');
      setHasShownPinPrompt(false);
      setPinCheckComplete(false);
      setHasPin(false); // Reset to force fresh check
      setPinCreatedSuccessfully(false);
      checkPinStatus();
      if (showHistory) {
        fetchTransferHistory();
      }
    }
  }, [isOpen, userId, showHistory]);

  // Automatically show PIN setup for subscribed users without PIN
  useEffect(() => {
    console.log('🔍 PIN Setup Check:', {
      isOpen,
      isSubscribed,
      hasPin,
      showPinSetup,
      hasShownPinPrompt,
      pinCheckComplete
    });
    
    if (isOpen && isSubscribed && !hasPin && !showPinSetup && !hasShownPinPrompt && pinCheckComplete) {
      console.log('✅ Automatically showing PIN setup modal');
      setShowPinSetup(true);
      setHasShownPinPrompt(true);
    }
  }, [isOpen, isSubscribed, hasPin, showPinSetup, hasShownPinPrompt, pinCheckComplete]);

  const checkPinStatus = async () => {
    console.log('🔍 Checking PIN status for user:', userId, 'isSubscribed:', isSubscribed);
    setPinCheckComplete(false);
    if (!isSubscribed) {
      console.log('❌ User not subscribed - no PIN check needed');
      setHasPin(false);
      setPinCheckComplete(true);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/users/${userId}/transfer-pin-status`);
      const data = await response.json();
      console.log('✅ PIN status response:', data);
      console.log('🔍 Detailed PIN check:', {
        hasPin: data.hasPin,
        isSubscribed: data.isSubscribed,
        calculatedValue: data.hasPin && data.isSubscribed,
        userId: userId
      });
      const hasPinValue = data.hasPin && data.isSubscribed;
      setHasPin(hasPinValue);
      setPinCheckComplete(true);
      
      // Automatically show PIN setup if user doesn't have one
      if (!hasPinValue) {
        console.log('🔑 No PIN detected - showing setup modal automatically');
        setShowPinSetup(true);
        setHasShownPinPrompt(true);
        // Don't allow access to transfer form without PIN
        return;
      }
    } catch (error) {
      console.error('❌ Error checking PIN status:', error);
      setHasPin(false);
      setPinCheckComplete(true);
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

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setMessage({ type: 'error', text: 'PIN must be exactly 4 digits' });
      return;
    }
    
    if (newPin !== confirmPin) {
      setMessage({ type: 'error', text: 'PINs do not match' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch(`${API_URL}/users/${userId}/create-transfer-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: newPin })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PIN');
      }
      
      setMessage({ 
        type: 'success', 
        text: 'PIN created successfully! You can now transfer tokens.' 
      });
      setPinCreatedSuccessfully(true);
      // Don't close modal or set hasPin yet - wait for user to click "Continue"
      setNewPin('');
      setConfirmPin('');
      
      // Don't refresh - we already have the correct state
    } catch (error) {
      console.error('Create PIN error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create PIN' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAfterPinCreation = () => {
    console.log('✅ User confirmed PIN creation - continuing to transfer');
    setHasPin(true);
    setShowPinSetup(false);
    setHasShownPinPrompt(false);
    setPinCheckComplete(true);
    setPinCreatedSuccessfully(false);
    setMessage(null);
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
        setShowPinSetup(true);
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

  // PIN Setup Modal
  if (showPinSetup) {
    return (
      <div className="transfer-overlay" onClick={() => {
        if (!pinCreatedSuccessfully) {
          setShowPinSetup(false);
        }
      }}>
        <div className="coin-transfer" onClick={(e) => e.stopPropagation()}>
          <div className="transfer-header">
            <h3>{pinCreatedSuccessfully ? '✅ PIN Created' : '🔐 Create Transfer PIN'}</h3>
            {!pinCreatedSuccessfully && (
              <button className="close-btn" onClick={() => setShowPinSetup(false)}>✕</button>
            )}
          </div>

          {pinCreatedSuccessfully ? (
            // Success state - show confirmation and continue button
            <>
              <div className="pin-success-container">
                <div className="success-icon">🎉</div>
                <h4 className="success-title">PIN Created Successfully!</h4>
                <p className="success-message">
                  Your 4-digit transfer PIN has been securely saved. You can now proceed with your token transfer.
                </p>
                <div className="security-reminder">
                  <p>🔒 Remember your PIN - you'll need it for all transfers</p>
                  <p>⚠️ Never share your PIN with anyone</p>
                </div>
              </div>
              <div className="button-group">
                <button 
                  className="transfer-btn continue-btn"
                  onClick={handleContinueAfterPinCreation}
                >
                  ➡️ Continue to Transfer
                </button>
              </div>
            </>
          ) : (
            // PIN creation form
            <>
              <p className="transfer-info">
                Create a 4-digit PIN to secure your token transfers. You'll need this PIN every time you transfer tokens.
              </p>

              <form onSubmit={handleCreatePin} className="transfer-form">
                <div className="form-group-inline">
                  <div className="form-field">
                    <label htmlFor="newPin">🔐 Enter New PIN</label>
                    <input
                      type="password"
                      id="newPin"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="****"
                      maxLength={4}
                      disabled={loading}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group-inline">
                  <div className="form-field">
                    <label htmlFor="confirmPin">🔐 Confirm PIN</label>
                    <input
                      type="password"
                      id="confirmPin"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="****"
                      maxLength={4}
                      disabled={loading}
                      required
                    />
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

                <div className="button-group">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowPinSetup(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="transfer-btn"
                    disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
                  >
                    {loading ? '⏳ Creating...' : '✅ Create PIN'}
                  </button>
                </div>

                <div className="security-notice">
                  <p>🔒 Keep your PIN secure and don't share it</p>
                  <p>⚠️ You'll need this PIN for all transfers</p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

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
            {/* Loading state while checking PIN */}
            {!pinCheckComplete && (
              <div className="transfer-loading">
                <span className="spinner"></span>
                <p>Checking PIN status...</p>
              </div>
            )}
            
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

            {isSubscribed && !hasPin && pinCheckComplete && (
              <div className="transfer-warning setup">
                <span className="warning-icon">🔐</span>
                <div className="warning-text">
                  <strong>PIN Setup Required</strong>
                  <p>Create a 4-digit PIN to secure your transfers</p>
                  <button 
                    type="button"
                    className="btn-setup-pin"
                    onClick={() => setShowPinSetup(true)}
                  >
                    ➕ Create PIN
                  </button>
                </div>
              </div>
            )}

            {/* Only show transfer form if user has PIN */}
            {isSubscribed && hasPin && (
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
            )}
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
