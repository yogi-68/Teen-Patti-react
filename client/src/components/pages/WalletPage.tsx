import React, { useState, useEffect } from 'react';
import TransactionRequest from '../transaction/TransactionRequest';
import CoinTransfer from '../transaction/CoinTransfer';
import './WalletPage.css';

interface WalletPageProps {
  userId: string;
  practiceCoins: number;
  realCoins: number;
  isSubscribed: boolean;
}

const WalletPage: React.FC<WalletPageProps> = ({ 
  userId, 
  practiceCoins, 
  realCoins,
  isSubscribed
}) => {
  const [hasMadeFirstDeposit, setHasMadeFirstDeposit] = useState(false);
  const [currentRealCoins, setCurrentRealCoins] = useState(realCoins);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Function to check deposit status
  const checkDepositStatus = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/transfer/check/${userId}`);
      const data = await response.json();
      setHasMadeFirstDeposit(data.hasMadeFirstDeposit || false);
      console.log('🔍 Deposit status checked:', data.hasMadeFirstDeposit);
    } catch (error) {
      console.error('Error checking deposit status:', error);
    }
  };

  useEffect(() => {
    // Check deposit status on mount and whenever realCoins changes
    checkDepositStatus();
  }, [userId, realCoins]);

  // Listen for balance updates
  useEffect(() => {
    const handleBalanceUpdate = () => {
      const stored = localStorage.getItem('realCoins');
      if (stored) {
        setCurrentRealCoins(Number(stored));
      }
      // Also re-check deposit status when balance updates
      checkDepositStatus();
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
    };
  }, []);

  // Check deposit status when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkDepositStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="wallet-page">
      <div className="wallet-balance">
        <div className="balance-card practice">
          <div className="balance-icon">🎮</div>
          <div className="balance-info">
            <span className="balance-label">Practice Coins</span>
            <span className="balance-amount">{practiceCoins}</span>
            <span className="balance-note">Free to play</span>
          </div>
        </div>
        
        <div className="balance-card real">
          <div className="balance-icon">💰</div>
          <div className="balance-info">
            <span className="balance-label">Real Cash</span>
            <span className="balance-amount">₹{currentRealCoins}</span>
            <span className="balance-note">Real money balance</span>
          </div>
        </div>
      </div>

      <TransactionRequest 
        userId={userId} 
        realCoins={currentRealCoins}
        isSubscribed={isSubscribed}
      />

      <div className="transfer-button-container">
        <button className="open-transfer-btn" onClick={() => setShowTransferModal(true)}>
          <span>💸</span>
          <span>Transfer Coins</span>
        </button>
      </div>

      <CoinTransfer
        userId={userId}
        realCoins={currentRealCoins}
        hasMadeFirstDeposit={hasMadeFirstDeposit}
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransferComplete={() => {
          // Refresh balance after transfer
          const stored = localStorage.getItem('realCoins');
          if (stored) {
            setCurrentRealCoins(Number(stored));
          }
          // Also refresh deposit status
          checkDepositStatus();
        }}
      />
    </div>
  );
};

export default WalletPage;
