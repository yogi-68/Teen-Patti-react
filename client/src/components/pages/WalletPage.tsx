import React, { useState } from 'react';
import SubscriptionRequest from '../subscription/SubscriptionRequest';
import TransactionRequest from '../transaction/TransactionRequest';
import './WalletPage.css';

interface WalletPageProps {
  userId: string;
  username: string;
  isSubscribed: boolean;
  practiceCoins: number;
  realCoins: number;
}

const WalletPage: React.FC<WalletPageProps> = ({ 
  userId, 
  username, 
  isSubscribed, 
  practiceCoins, 
  realCoins 
}) => {
  const [activeTab, setActiveTab] = useState<'subscription' | 'transactions'>('subscription');

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <h1>💎 Premium & Wallet</h1>
        <p>Manage your subscription and wallet transactions</p>
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
            <span className="balance-label">Real Coins</span>
            <span className="balance-amount">{realCoins}</span>
            <span className="balance-note">
              {isSubscribed ? 'Premium member' : 'Subscribe to unlock'}
            </span>
          </div>
        </div>
      </div>

      <div className="wallet-tabs">
        <button 
          className={`tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          <span className="tab-icon">⭐</span>
          <span>Subscription</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <span className="tab-icon">💳</span>
          <span>Transactions</span>
        </button>
      </div>

      <div className="wallet-content">
        {activeTab === 'subscription' ? (
          <SubscriptionRequest userId={userId} username={username} />
        ) : (
          <TransactionRequest 
            userId={userId} 
            username={username} 
            isSubscribed={isSubscribed}
            realCoins={realCoins}
          />
        )}
      </div>
    </div>
  );
};

export default WalletPage;
