import React, { useEffect, useState } from 'react';
import './AdminUsers.css';
import { apiFetch } from '../../utils/api';

interface UserItem {
  _id: string;
  username: string;
  email: string;
  coins: number;
  practiceCoins: number;
  realCoins: number;
  cashBalance: number;
  isAdmin?: boolean;
  isSubscribed?: boolean;
  createdAt?: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin' | 'subscribed' | 'regular'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'admin') return user.isAdmin;
    if (filter === 'subscribed') return user.isSubscribed;
    if (filter === 'regular') return !user.isAdmin && !user.isSubscribed;
    return true;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="admin-users">
      <div className="users-header">
        <h2>User Management</h2>
        <div className="users-stats">
          <span className="stat-badge">Total: {users.length}</span>
          <span className="stat-badge">Admins: {users.filter(u => u.isAdmin).length}</span>
          <span className="stat-badge">Subscribed: {users.filter(u => u.isSubscribed).length}</span>
        </div>
      </div>

      <div className="users-filters">
        <button 
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          All Users
        </button>
        <button 
          className={filter === 'admin' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('admin')}
        >
          Admins
        </button>
        <button 
          className={filter === 'subscribed' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('subscribed')}
        >
          Subscribed
        </button>
        <button 
          className={filter === 'regular' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('regular')}
        >
          Regular
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Practice Coins</th>
                <th>Real Cash</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">No users found</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="username-cell">
                        {u.username}
                        {u.isAdmin && <span className="badge admin-badge">Admin</span>}
                      </div>
                    </td>
                    <td>{u.email || 'N/A'}</td>
                    <td>🪙 {u.practiceCoins || u.coins || 0}</td>
                    <td>₹{(u.realCoins || u.cashBalance || 0).toLocaleString()}</td>
                    <td>
                      {u.isSubscribed ? (
                        <span className="badge subscribed-badge">⭐ Subscribed</span>
                      ) : (
                        <span className="badge regular-badge">Free</span>
                      )}
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
