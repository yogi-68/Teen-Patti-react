import React, { useEffect, useState } from 'react';
import './AdminTransactions.css';
import { apiFetch, showAlert, showConfirm, formatDate } from '../../utils/api';

interface TransactionItem {
  _id: string;
  userId: string;
  username: string;
  type: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  upiId?: string;
  accountNumber?: string;
  remarks?: string;
  adminUsername?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const statusQuery = filter !== 'all' ? `?status=${filter}` : '';
      const data = await apiFetch(`/admin/transactions${statusQuery}`);
      setTransactions(data.transactions || []);
      
      // Count pending transactions
      const pending = (data.transactions || []).filter((t: TransactionItem) => t.status === 'pending').length;
      setPendingCount(pending);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    if (!showConfirm('Approve this transaction?')) return;
    
    try {
      await apiFetch(`/admin/transactions/${id}/approve`, { method: 'PATCH' });
      showAlert('Transaction approved successfully', 'success');
      fetchTransactions();
    } catch (err) {
      showAlert('Error approving transaction', 'error');
    }
  };

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      await apiFetch(`/admin/transactions/${id}/reject`, { 
        method: 'PATCH',
        body: JSON.stringify({ remarks: reason || 'Rejected by admin' }) 
      });
      showAlert('Transaction rejected', 'success');
      fetchTransactions();
    } catch (err) {
      showAlert('Error rejecting transaction', 'error');
    }
  };

  return (
    <div className="admin-transactions">
      <div className="header">
        <h2>Transaction Requests</h2>
        {pendingCount > 0 && (
          <span className="pending-badge">{pendingCount} Pending</span>
        )}
      </div>

      {/* Payout Flow Information */}
      <div className="payout-info-section">
        <h3 className="payout-title">💰 Payout Flow Structure</h3>
        <div className="payout-cards">
          <div className="payout-card admin-share">
            <div className="payout-percentage">40%</div>
            <div className="payout-label">Admin Fee</div>
            <div className="payout-desc">Platform commission from each game pot</div>
          </div>
          <div className="payout-arrow">→</div>
          <div className="payout-card winner-share">
            <div className="payout-percentage">60%</div>
            <div className="payout-label">Winner Gets</div>
            <div className="payout-desc">Player receives 60% of the total pot</div>
          </div>
        </div>
        <div className="payout-example">
          <strong>Example:</strong> If pot is ₹1000 → Admin gets ₹400, Winner gets ₹600
        </div>
      </div>

      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
        <button
          className={filter === 'rejected' ? 'active' : ''}
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {!loading && transactions.length === 0 && (
        <div className="no-data">No transactions found</div>
      )}

      {!loading && transactions.length > 0 && (
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Payment Details</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id} className={`status-${t.status}`}>
                  <td>{t.username}</td>
                  <td>
                    <span className={`type-badge ${t.type}`}>
                      {t.type === 'deposit' ? '⬇️' : '⬆️'} {t.type}
                    </span>
                  </td>
                  <td className="amount">₹{t.amount}</td>
                  <td className="payment-details">
                    {t.paymentMethod && <div>Method: {t.paymentMethod}</div>}
                    {t.upiId && <div>UPI: {t.upiId}</div>}
                    {t.accountNumber && <div>Account: {t.accountNumber}</div>}
                  </td>
                  <td>
                    <span className={`status-badge ${t.status}`}>
                      {t.status}
                    </span>
                    {t.adminUsername && (
                      <div className="admin-info">by {t.adminUsername}</div>
                    )}
                  </td>
                  <td className="date">{formatDate(t.createdAt)}</td>
                  <td className="actions">
                    {t.status === 'pending' ? (
                      <>
                        <button className="approve-btn" onClick={() => approve(t._id)}>
                          ✓ Approve
                        </button>
                        <button className="reject-btn" onClick={() => reject(t._id)}>
                          ✗ Reject
                        </button>
                      </>
                    ) : (
                      <span className="processed">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
