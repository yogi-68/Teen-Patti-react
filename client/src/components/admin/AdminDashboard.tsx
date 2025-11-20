import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { apiFetch } from '../../utils/api';

interface AdminDashboardProps {}

interface DashboardStats {
  totalUsers: number;
  pendingTransactions: number;
  totalRevenue: number;
  totalWithdrawals: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingTransactions: 0,
    totalRevenue: 0,
    totalWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await apiFetch('/admin/stats');
      setStats({
        totalUsers: data.totalUsers || 0,
        pendingTransactions: data.pendingTransactions || 0,
        totalRevenue: data.totalRevenue || 0,
        totalWithdrawals: data.totalWithdrawals || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Quick stats and actions for administrators.</p>
      <div className="admin-grid">
        <div className="card">
          <div className="card-icon">👥</div>
          <div className="card-label">Total Users</div>
          <div className="card-value">{loading ? '...' : stats.totalUsers}</div>
        </div>
        <div className="card">
          <div className="card-icon">⏳</div>
          <div className="card-label">Pending Transactions</div>
          <div className="card-value">{loading ? '...' : stats.pendingTransactions}</div>
        </div>
        <div className="card">
          <div className="card-icon">💰</div>
          <div className="card-label">Total Revenue</div>
          <div className="card-value">₹{loading ? '...' : stats.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="card-icon">💸</div>
          <div className="card-label">Total Withdrawals</div>
          <div className="card-value">₹{loading ? '...' : stats.totalWithdrawals.toLocaleString()}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/users')}
          >
            <span className="action-icon">👥</span>
            <span className="action-text">Manage Users</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/subscriptions')}
          >
            <span className="action-icon">⭐</span>
            <span className="action-text">Subscriptions</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/transactions')}
          >
            <span className="action-icon">💰</span>
            <span className="action-text">Transactions</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/enquiries')}
          >
            <span className="action-icon">📧</span>
            <span className="action-text">Help & Support</span>
          </button>
          <button 
            className="action-btn bot-btn"
            onClick={() => navigate('/admin/bots')}
          >
            <span className="action-icon">🤖</span>
            <span className="action-text">Bot Management</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/table-seats')}
          >
            <span className="action-icon">🎲</span>
            <span className="action-text">Table Seat Manager</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/admin/bot-monitoring')}
          >
            <span className="action-icon">📊</span>
            <span className="action-text">Bot Monitoring</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
