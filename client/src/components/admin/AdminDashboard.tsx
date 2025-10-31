import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface AdminDashboardProps {}

interface DashboardStats {
  totalUsers: number;
  pendingTransactions: number;
  totalRevenue: number;
  totalWithdrawals: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
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
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: {
          'x-user-id': localStorage.getItem('userId') || '',
        },
      });
      const data = await response.json();
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
      <div className="admin-links">
        <Link to="/admin/users" className="admin-link">Manage Users</Link>
        <Link to="/admin/transactions" className="admin-link">Transactions</Link>
        <Link to="/admin/subscriptions" className="admin-link">Subscription Requests</Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
