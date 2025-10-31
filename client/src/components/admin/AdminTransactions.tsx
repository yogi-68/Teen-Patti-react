import React, { useEffect, useState } from 'react';

interface TransactionItem {
  _id: string;
  username: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  useEffect(() => {
    fetch('/api/admin/transactions')
      .then(r => r.json())
      .then(data => setTransactions(data.transactions || []))
      .catch(err => console.error(err));
  }, []);

  const approve = async (id: string) => {
    await fetch(`/api/admin/transactions/${id}/approve`, { method: 'PATCH', headers: { 'x-user-id': localStorage.getItem('userId') || '' } });
    setTransactions(prev => prev.map(t => t._id === id ? { ...t, status: 'approved' } : t));
  };

  const reject = async (id: string) => {
    await fetch(`/api/admin/transactions/${id}/reject`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('userId') || '' }, body: JSON.stringify({ remarks: 'Rejected by admin' }) });
    setTransactions(prev => prev.map(t => t._id === id ? { ...t, status: 'rejected' } : t));
  };

  return (
    <div className="admin-transactions">
      <h2>Transactions</h2>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t._id}>
              <td>{t.username}</td>
              <td>{t.type}</td>
              <td>₹{t.amount}</td>
              <td>{t.status}</td>
              <td>
                {t.status === 'pending' && (
                  <>
                    <button onClick={() => approve(t._id)}>Approve</button>
                    <button onClick={() => reject(t._id)}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTransactions;
