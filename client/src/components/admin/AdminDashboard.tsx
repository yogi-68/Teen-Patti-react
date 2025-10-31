import React from 'react';
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
    </div>
  );
};

export default AdminDashboard;
