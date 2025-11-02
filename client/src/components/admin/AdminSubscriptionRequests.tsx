import React, { useState, useEffect } from 'react';
import './AdminSubscriptionRequests.css';
import { apiFetch, showAlert, showConfirm, formatDate } from '../../utils/api';

interface SubscriptionRequest {
  _id: string;
  userId: string;
  username: string;
  email: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
  processedBy?: string;
  adminNote?: string;
}

const AdminSubscriptionRequests: React.FC = () => {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [initialCoins, setInitialCoins] = useState<number>(100);
  const [adminNote, setAdminNote] = useState<string>('');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusQuery = filter !== 'all' ? `?status=${filter}` : '';
      const data = await apiFetch(`/admin/subscription-requests${statusQuery}`);
      setRequests(data.requests);
      setPendingCount(data.pendingCount);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!showConfirm('Approve this subscription request?')) return;

    setProcessingId(requestId);
    try {
      const data = await apiFetch(`/admin/subscription-requests/${requestId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({
          initialRealCoins: initialCoins,
          adminNote: adminNote || 'Approved',
        }),
      });

      showAlert(`${data.message}\nUser: ${data.user.username}\nReal Coins: ${data.user.realCoins}`, 'success');
      fetchRequests();
      setAdminNote('');
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const note = prompt('Reason for rejection (optional):');
    if (note === null) return; // User cancelled

    setProcessingId(requestId);
    try {
      await apiFetch(`/admin/subscription-requests/${requestId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({
          adminNote: note || 'Rejected',
        }),
      });

      showAlert('Request rejected successfully', 'success');
      fetchRequests();
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="admin-subscription-requests">
      <div className="header">
        <h2>Subscription Requests</h2>
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
      {error && <div className="error">{error}</div>}

      {!loading && requests.length === 0 && (
        <div className="no-data">No subscription requests found</div>
      )}

      <div className="requests-list">
        {requests.map((request) => (
          <div key={request._id} className={`request-card ${request.status}`}>
            <div className="request-header">
              <div className="user-info">
                <h3>{request.username}</h3>
                <p className="email">{request.email}</p>
              </div>
              <span className={`status-badge ${request.status}`}>
                {request.status.toUpperCase()}
              </span>
            </div>

            <div className="request-body">
              <div className="message">
                <strong>Message:</strong>
                <p>{request.message}</p>
              </div>

              <div className="metadata">
                <p><strong>Requested:</strong> {formatDate(request.requestDate)}</p>
                {request.processedDate && (
                  <p><strong>Processed:</strong> {formatDate(request.processedDate)}</p>
                )}
                {request.adminNote && (
                  <p><strong>Admin Note:</strong> {request.adminNote}</p>
                )}
              </div>
            </div>

            {request.status === 'pending' && (
              <div className="request-actions">
                <div className="input-group">
                  <label>Initial Real Coins:</label>
                  <input
                    type="number"
                    value={initialCoins}
                    onChange={(e) => setInitialCoins(Number(e.target.value))}
                    min="0"
                    step="50"
                  />
                </div>
                <div className="input-group">
                  <label>Admin Note (optional):</label>
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="e.g., Approved with initial coins"
                  />
                </div>
                <div className="action-buttons">
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(request._id)}
                    disabled={processingId === request._id}
                  >
                    {processingId === request._id ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(request._id)}
                    disabled={processingId === request._id}
                  >
                    {processingId === request._id ? 'Processing...' : '✗ Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSubscriptionRequests;
