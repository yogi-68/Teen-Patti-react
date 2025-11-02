import React from 'react';
import TransactionRequest from '../transaction/TransactionRequest';
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

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <h1>� Wallet & Transactions</h1>
        <p>Manage your deposits and withdrawals</p>
      </div>

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
            <span className="balance-amount">₹{realCoins}</span>
            <span className="balance-note">Real money balance</span>
          </div>
        </div>
      </div>

      <TransactionRequest 
        userId={userId} 
        realCoins={realCoins}
        isSubscribed={isSubscribed}
      />
    </div>
  );
};

export default WalletPage;
