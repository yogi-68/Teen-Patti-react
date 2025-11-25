import React, { useState, useEffect } from 'react';
import TransactionRequest from '../transaction/TransactionRequest';
import CoinTransfer from '../transaction/CoinTransfer';
import './WalletPage.css';

interface WalletPageProps {
  userId: string;
  practiceTrial: number;
  realToken: number;
  isSubscribed: boolean;
}

const WalletPage: React.FC<WalletPageProps> = ({ 
  userId, 
  practiceTrial, 
  realToken,
  isSubscribed
}) => {
  const [hasMadeFirstDeposit, setHasMadeFirstDeposit] = useState(false);
  const [currentRealToken, setCurrentRealToken] = useState(realToken);
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
    // Check deposit status on mount and whenever realToken changes
    checkDepositStatus();
  }, [userId, realToken]);

  // Listen for balance updates
  useEffect(() => {
    const handleBalanceUpdate = () => {
      const stored = localStorage.getItem('realToken');
      if (stored) {
        setCurrentRealToken(Number(stored));
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
            <span className="balance-label">Practice Trial</span>
            <span className="balance-amount">{practiceTrial}</span>
            <span className="balance-note">Free to play</span>
          </div>
        </div>
        
        <div className="balance-card real">
          <div className="balance-icon">💰</div>
          <div className="balance-info">
            <span className="balance-label">Real Token</span>
            <span className="balance-amount">₹{currentRealToken}</span>
            <span className="balance-note">Real token balance</span>
          </div>
        </div>
      </div>

      <TransactionRequest 
        userId={userId} 
        realToken={currentRealToken}
        isSubscribed={isSubscribed}
      />

      <div className="transfer-button-container">
        <button className="open-transfer-btn" onClick={() => setShowTransferModal(true)}>
          <span>💸</span>
          <span>Transfer Trial</span>
        </button>
      </div>

      <CoinTransfer
        userId={userId}
        realToken={currentRealToken}
        hasMadeFirstDeposit={hasMadeFirstDeposit}
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransferComplete={() => {
          // Refresh balance after transfer
          const stored = localStorage.getItem('realToken');
          if (stored) {
            setCurrentRealToken(Number(stored));
          }
          // Also refresh deposit status
          checkDepositStatus();
        }}
      />
    </div>
  );
};

export default WalletPage;
