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

  useEffect(() => {
    // Check if user has made first deposit
    const checkDepositStatus = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/transfer/check/${userId}`);
        const data = await response.json();
        setHasMadeFirstDeposit(data.hasMadeFirstDeposit || false);
      } catch (error) {
        console.error('Error checking deposit status:', error);
      }
    };

    checkDepositStatus();
  }, [userId]);

  // Listen for balance updates
  useEffect(() => {
    const handleBalanceUpdate = () => {
      const stored = localStorage.getItem('realCoins');
      if (stored) {
        setCurrentRealCoins(Number(stored));
      }
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
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

      <CoinTransfer
        userId={userId}
        realCoins={currentRealCoins}
        hasMadeFirstDeposit={hasMadeFirstDeposit}
        onTransferComplete={() => {
          // Refresh balance after transfer
          const stored = localStorage.getItem('realCoins');
          if (stored) {
            setCurrentRealCoins(Number(stored));
          }
        }}
      />
    </div>
  );
};

export default WalletPage;
