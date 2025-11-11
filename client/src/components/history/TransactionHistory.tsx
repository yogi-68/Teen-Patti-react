import { useState, useEffect } from 'react';
import './TransactionHistory.css';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  metadata?: any;
}

interface TransactionStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalReferralEarnings: number;
  totalJokerDeductions: number;
  totalGameWins: number;
  totalGameLosses: number;
  netGameProfit: number;
}

type TabType = 'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'REFERRAL_BONUS' | 'JOKER' | 'GAME';

function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    fetchTransactionHistory();
    fetchStats();
  }, [activeTab, page]);

  const fetchTransactionHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('Please log in to view transaction history');
        setLoading(false);
        return;
      }

      const typeFilter = activeTab !== 'ALL' ? `&type=${activeTab}` : '';
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/history?page=${page}&limit=${limit}${typeFilter}`,
        {
          headers: {
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (page === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }
      
      setHasMore(data.hasMore);
      setError(null);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/history/stats`,
        {
          headers: {
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    setTransactions([]);
    setLoading(true);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return '💳';
      case 'WITHDRAWAL':
        return '🏦';
      case 'REFERRAL_BONUS':
        return '🎁';
      case 'JOKER_DEDUCTION':
        return '🃏';
      case 'GAME_WIN':
        return '🏆';
      case 'GAME_LOSS':
        return '❌';
      case 'TRANSFER_SENT':
        return '📤';
      case 'TRANSFER_RECEIVED':
        return '📥';
      default:
        return '💰';
    }
  };

  const getAmountColor = (type: string) => {
    if (type === 'WITHDRAWAL' || type === 'JOKER_DEDUCTION' || type === 'GAME_LOSS' || type === 'TRANSFER_SENT') {
      return 'negative';
    }
    return 'positive';
  };

  const formatAmount = (type: string, amount: number) => {
    const isNegative = type === 'WITHDRAWAL' || type === 'JOKER_DEDUCTION' || type === 'GAME_LOSS' || type === 'TRANSFER_SENT';
    return `${isNegative ? '-' : '+'}🪙 ${Math.abs(amount).toFixed(2)}`;
  };

  if (loading && page === 1) {
    return (
      <div className="transaction-history">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="transaction-history">
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => { setPage(1); fetchTransactionHistory(); }} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history">
      <div className="history-header">
        <h2>📊 Transaction History</h2>
        <p className="history-subtitle">Track all your financial activities</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card deposits">
            <div className="stat-icon">💳</div>
            <div className="stat-content">
              <div className="stat-label">Total Deposits</div>
              <div className="stat-value">🪙 {stats.totalDeposits.toFixed(2)}</div>
            </div>
          </div>
          <div className="stat-card withdrawals">
            <div className="stat-icon">🏦</div>
            <div className="stat-content">
              <div className="stat-label">Total Withdrawals</div>
              <div className="stat-value">🪙 {stats.totalWithdrawals.toFixed(2)}</div>
            </div>
          </div>
          <div className="stat-card referrals">
            <div className="stat-icon">🎁</div>
            <div className="stat-content">
              <div className="stat-label">Referral Earnings</div>
              <div className="stat-value">🪙 {stats.totalReferralEarnings.toFixed(2)}</div>
            </div>
          </div>
          <div className="stat-card game-profit">
            <div className="stat-icon">{stats.netGameProfit >= 0 ? '📈' : '📉'}</div>
            <div className="stat-content">
              <div className="stat-label">Net Game Profit</div>
              <div className={`stat-value ${stats.netGameProfit >= 0 ? 'positive' : 'negative'}`}>
                🪙 {stats.netGameProfit.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => handleTabChange('ALL')}
        >
          All
        </button>
        <button 
          className={`tab ${activeTab === 'DEPOSIT' ? 'active' : ''}`}
          onClick={() => handleTabChange('DEPOSIT')}
        >
          💳 Deposits
        </button>
        <button 
          className={`tab ${activeTab === 'WITHDRAWAL' ? 'active' : ''}`}
          onClick={() => handleTabChange('WITHDRAWAL')}
        >
          🏦 Withdrawals
        </button>
        <button 
          className={`tab ${activeTab === 'REFERRAL_BONUS' ? 'active' : ''}`}
          onClick={() => handleTabChange('REFERRAL_BONUS')}
        >
          🎁 Referrals
        </button>
        <button 
          className={`tab ${activeTab === 'JOKER' ? 'active' : ''}`}
          onClick={() => handleTabChange('JOKER')}
        >
          🃏 Joker
        </button>
        <button 
          className={`tab ${activeTab === 'GAME' ? 'active' : ''}`}
          onClick={() => handleTabChange('GAME')}
        >
          🎮 Games
        </button>
      </div>

      {/* Transactions List */}
      <div className="transactions-container">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>📭 No transactions found</p>
            <p className="empty-hint">Your transaction history will appear here</p>
          </div>
        ) : (
          <>
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="transaction-card">
                  <div className="transaction-icon">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-type">
                      {transaction.type.replace(/_/g, ' ')}
                    </div>
                    <div className="transaction-description">
                      {transaction.description}
                    </div>
                    <div className="transaction-date">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="transaction-amounts">
                    <div className={`transaction-amount ${getAmountColor(transaction.type)}`}>
                      {formatAmount(transaction.type, transaction.amount)}
                    </div>
                    <div className="transaction-balance">
                      Balance: 🪙 {transaction.balanceAfter.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {hasMore && (
              <button 
                onClick={loadMore} 
                className="btn-load-more"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;
