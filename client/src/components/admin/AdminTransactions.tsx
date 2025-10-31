import React, { useEffect, useState } from 'react';
import './AdminTransactions.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
      const response = await fetch(`${API_URL}/admin/transactions${statusQuery}`, {
        headers: {
          'x-user-id': localStorage.getItem('userId') || '',
        },
      });
      const data = await response.json();
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
    if (!confirm('Approve this transaction?')) return;
    
    try {
      await fetch(`${API_URL}/admin/transactions/${id}/approve`, { 
        method: 'PATCH', 
        headers: { 
          'x-user-id': localStorage.getItem('userId') || '' 
        } 
      });
      alert('✅ Transaction approved successfully');
      fetchTransactions();
    } catch (err) {
      alert('❌ Error approving transaction');
    }
  };

  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      await fetch(`${API_URL}/admin/transactions/${id}/reject`, { 
        method: 'PATCH', 
        headers: { 
          'Content-Type': 'application/json', 
          'x-user-id': localStorage.getItem('userId') || '' 
        }, 
        body: JSON.stringify({ remarks: reason || 'Rejected by admin' }) 
      });
      alert('✅ Transaction rejected');
      fetchTransactions();
    } catch (err) {
      alert('❌ Error rejecting transaction');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="admin-transactions">
      <div className="header">
        <h2>Transaction Requests</h2>
        {pendingCount > 0 && (
          <span className="pending-badge">{pendingCount} Pending</span>
        )}
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
