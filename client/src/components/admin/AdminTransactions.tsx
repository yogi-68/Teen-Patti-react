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
  const [commissionPercentage, setCommissionPercentage] = useState<number>(40);
  const [editingCommission, setEditingCommission] = useState(false);
  const [newCommission, setNewCommission] = useState<string>('40');

  useEffect(() => {
    fetchTransactions();
    fetchCommissionSettings();
  }, [filter]);

  const fetchCommissionSettings = async () => {
    try {
      const data = await apiFetch('/settings/withdrawalCommission');
      setCommissionPercentage(data.setting.value);
      setNewCommission(String(data.setting.value));
    } catch (err) {
      console.error('Error fetching commission settings:', err);
    }
  };

  const updateCommission = async () => {
    const value = parseFloat(newCommission);
    if (isNaN(value) || value < 0 || value > 100) {
      showAlert('Commission must be between 0 and 100', 'error');
      return;
    }

    try {
      await apiFetch('/settings/withdrawalCommission', {
        method: 'PATCH',
        body: JSON.stringify({ 
          value,
          updatedBy: localStorage.getItem('username') || 'admin'
        })
      });
      setCommissionPercentage(value);
      setEditingCommission(false);
      showAlert('Commission percentage updated successfully', 'success');
    } catch (err) {
      showAlert('Error updating commission', 'error');
    }
  };

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

      {/* Commission Settings */}
      <div className="commission-settings">
        <div className="commission-info">
          <span className="commission-label">💰 Withdrawal Commission:</span>
          {!editingCommission ? (
            <>
              <span className="commission-value">{commissionPercentage}%</span>
              <button 
                className="edit-commission-btn"
                onClick={() => setEditingCommission(true)}
              >
                ✏️ Edit
              </button>
            </>
          ) : (
            <>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newCommission}
                onChange={(e) => setNewCommission(e.target.value)}
                className="commission-input"
              />
              <button 
                className="save-commission-btn"
                onClick={updateCommission}
              >
                ✓ Save
              </button>
              <button 
                className="cancel-commission-btn"
                onClick={() => {
                  setEditingCommission(false);
                  setNewCommission(String(commissionPercentage));
                }}
              >
                ✗ Cancel
              </button>
            </>
          )}
        </div>
        <p className="commission-note">
          This percentage is deducted from withdrawals as platform revenue
        </p>
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
                <th>Commission</th>
                <th>Net Amount</th>
                <th>Payment Details</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => {
                const isWithdrawal = t.type === 'withdrawal';
                const commission = isWithdrawal ? (t.amount * commissionPercentage / 100) : 0;
                const netAmount = isWithdrawal ? (t.amount - commission) : t.amount;
                
                return (
                  <tr key={t._id} className={`status-${t.status}`}>
                    <td>{t.username}</td>
                    <td>
                      <span className={`type-badge ${t.type}`}>
                        {t.type === 'deposit' ? '⬇️' : '⬆️'} {t.type}
                      </span>
                    </td>
                    <td className="amount">₹{t.amount}</td>
                    <td className="commission">
                      {isWithdrawal ? (
                        <span className="commission-amount">
                          ₹{commission.toFixed(2)} ({commissionPercentage}%)
                        </span>
                      ) : (
                        <span className="no-commission">—</span>
                      )}
                    </td>
                    <td className="net-amount">
                      {isWithdrawal ? (
                        <span className="net-value">₹{netAmount.toFixed(2)}</span>
                      ) : (
                        <span className="full-amount">₹{t.amount}</span>
                      )}
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
