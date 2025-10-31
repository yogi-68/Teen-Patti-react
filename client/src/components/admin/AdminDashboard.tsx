import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

interface AdminDashboardProps {}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Quick stats and actions for administrators.</p>
      <div className="admin-grid">
        <div className="card">Users: --</div>
        <div className="card">Pending Transactions: --</div>
        <div className="card">Active Games: --</div>
        <div className="card">Revenue: --</div>
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
