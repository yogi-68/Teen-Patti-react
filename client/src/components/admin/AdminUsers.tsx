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
  isBlocked?: boolean;
  createdAt?: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin' | 'subscribed' | 'regular' | 'blocked'>('all');

  useEffect(() => {
    fetchUsers();
    fetchBlockedUsers();
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

  const fetchBlockedUsers = async () => {
    try {
      const data = await apiFetch('/admin/users/blocked/list');
      setBlockedUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to block this user?')) return;
    
    try {
      await apiFetch(`/admin/users/${userId}/block`, { method: 'PUT' });
      alert('User blocked successfully');
      fetchUsers();
      fetchBlockedUsers();
    } catch (err) {
      console.error('Error blocking user:', err);
      alert('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to unblock this user?')) return;
    
    try {
      await apiFetch(`/admin/users/${userId}/unblock`, { method: 'PUT' });
      alert('User unblocked successfully');
      fetchUsers();
      fetchBlockedUsers();
    } catch (err) {
      console.error('Error unblocking user:', err);
      alert('Failed to unblock user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? All data will be retained.')) return;
    
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      alert('User deleted successfully (data retained)');
      fetchUsers();
      fetchBlockedUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
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
        <button 
          className={filter === 'blocked' ? 'filter-btn active blocked-filter' : 'filter-btn blocked-filter'}
          onClick={() => setFilter('blocked')}
        >
          🚫 Blocked ({blockedUsers.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : filter === 'blocked' ? (
        // Blocked Users Section
        <div className="blocked-users-section">
          <div className="blocked-header">
            <h3>🚫 Blocked Users</h3>
            <p className="blocked-description">Users who have been blocked from accessing the system</p>
          </div>
          {blockedUsers.length === 0 ? (
            <div className="no-data">No blocked users</div>
          ) : (
            <div className="blocked-users-grid">
              {blockedUsers.map(user => (
                <div key={user._id} className="blocked-user-card">
                  <div className="blocked-user-info">
                    <h4>{user.username}</h4>
                    <p className="user-email">{user.email}</p>
                    <div className="user-stats">
                      <span>🪙 {user.practiceCoins || 0}</span>
                      <span>₹{(user.realCoins || 0).toLocaleString()}</span>
                    </div>
                    <p className="joined-date">Joined: {formatDate(user.createdAt)}</p>
                  </div>
                  <div className="blocked-user-actions">
                    <button 
                      className="btn-unblock"
                      onClick={() => handleUnblockUser(user._id)}
                    >
                      ✅ Unblock
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Regular Users Table
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data">No users found</td>
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
                    <td>
                      <button 
                        className="btn-action btn-block"
                        onClick={() => handleBlockUser(u._id)}
                        disabled={u.isAdmin}
                        title={u.isAdmin ? "Cannot block admin users" : "Block user"}
                      >
                        🚫 Block
                      </button>
                    </td>
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
