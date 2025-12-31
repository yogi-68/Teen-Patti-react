import React, { useState, useEffect } from 'react';
import './AdminPasswordResetRequests.css';

interface PasswordResetRequest {
  _id: string;
  userId: string;
  username: string;
  email: string;
  userIdentifier: string;
  requestType: 'login' | 'token';
  status: 'pending' | 'completed' | 'rejected';
  requestDate: string;
  processedDate?: string;
  processedBy?: string;
  adminNote?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const AdminPasswordResetRequests: React.FC = () => {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/password-reset/requests?status=${filter}`);
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch password reset requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest) return;

    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const adminId = localStorage.getItem('userId') || 'admin';
      
      const response = await fetch(`${API_URL}/password-reset/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest._id,
          newPassword,
          adminId,
          adminNote
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Password reset successfully!\n\n📧 IMPORTANT: You must manually email the new password to:\n${data.userEmail}\n\nPassword has been updated in the database.`);
        setShowProcessModal(false);
        setSelectedRequest(null);
        setNewPassword('');
        setConfirmPassword('');
        setAdminNote('');
        fetchRequests(); // Refresh the list
      } else {
        setError(data.error || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error processing password reset:', error);
      setError('Failed to connect to server');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRequest = async (request: PasswordResetRequest) => {
    if (!confirm(`Are you sure you want to reject the password reset request from ${request.username}?`)) {
      return;
    }

    try {
      const adminId = localStorage.getItem('userId') || 'admin';
      const note = prompt('Reason for rejection (optional):') || 'Request rejected by admin';

      const response = await fetch(`${API_URL}/password-reset/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request._id,
          adminId,
          adminNote: note
        })
      });

      if (response.ok) {
        alert('Request has been rejected');
        fetchRequests();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting password reset:', error);
      alert('Failed to connect to server');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-badge status-pending';
      case 'completed':
        return 'status-badge status-completed';
      case 'rejected':
        return 'status-badge status-rejected';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="password-reset-container">
      <div className="password-reset-header">
        <h1>🔐 Password Reset Requests</h1>
        <p className="header-subtitle">Manage user password reset requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Requests
        </button>
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <p>No password reset requests found</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-card-header">
                <div className="user-info">
                  <h3>{request.username}</h3>
                  <p className="user-email">{request.email}</p>
                  <p className="request-type-badge">
                    {request.requestType === 'login' ? '🔑 Login Reset' : '💳 Token Transfer Reset'}
                  </p>
                </div>
                <span className={getStatusBadgeClass(request.status)}>
                  {request.status.toUpperCase()}
                </span>
              </div>

              <div className="request-details">
                <div className="detail-row">
                  <span className="detail-label">User ID:</span>
                  <span className="detail-value">{request.userId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Identifier Used:</span>
                  <span className="detail-value">{request.userIdentifier}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Request Date:</span>
                  <span className="detail-value">{formatDate(request.requestDate)}</span>
                </div>
                {request.processedDate && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Processed Date:</span>
                      <span className="detail-value">{formatDate(request.processedDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Processed By:</span>
                      <span className="detail-value">{request.processedBy || 'N/A'}</span>
                    </div>
                  </>
                )}
                {request.adminNote && (
                  <div className="detail-row">
                    <span className="detail-label">Admin Note:</span>
                    <span className="detail-value">{request.adminNote}</span>
                  </div>
                )}
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button
                    className="btn-process"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowProcessModal(true);
                      setError('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setAdminNote('');
                    }}
                  >
                    Set New Password
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => handleRejectRequest(request)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Process Password Reset Modal */}
      {showProcessModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => {
          if (!processing) {
            setShowProcessModal(false);
            setSelectedRequest(null);
            setError('');
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔑 Set New Password</h2>
              <button 
                className="btn-close"
                onClick={() => {
                  if (!processing) {
                    setShowProcessModal(false);
                    setSelectedRequest(null);
                    setError('');
                  }
                }}
                disabled={processing}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="user-info-box">
                <p><strong>Request Type:</strong> {selectedRequest.requestType === 'login' ? '🔑 Login Reset' : '💳 Token Transfer Reset'}</p>
                <p><strong>Username:</strong> {selectedRequest.username}</p>
                <p><strong>Email:</strong> {selectedRequest.email}</p>
              </div>

              <div className="email-notice-box">
                <p><strong>⚠️ Important:</strong> After setting the new password, you must manually email the user at <strong>{selectedRequest.email}</strong> with their new password. An automated confirmation email will NOT be sent.</p>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  disabled={processing}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={processing}
                />
              </div>

              <div className="form-group">
                <label htmlFor="adminNote">Admin Note (Optional)</label>
                <textarea
                  id="adminNote"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add any notes about this password reset..."
                  rows={3}
                  disabled={processing}
                />
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    if (!processing) {
                      setShowProcessModal(false);
                      setSelectedRequest(null);
                      setError('');
                    }
                  }}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  className="btn-submit"
                  onClick={handleProcessRequest}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Reset Password & Notify User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPasswordResetRequests;
