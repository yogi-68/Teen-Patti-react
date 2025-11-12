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
  // Store coins per request ID to ensure each request has its own coin value
  const [coinsPerRequest, setCoinsPerRequest] = useState<Record<string, number>>({});
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
      // Get the specific coin amount for this request, default to 100 if not set
      const coinsToAdd = coinsPerRequest[requestId] || 100;
      
      const data = await apiFetch(`/admin/subscription-requests/${requestId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({
          initialRealCoins: coinsToAdd,
          adminNote: adminNote || 'Approved',
        }),
      });

      showAlert(`${data.message}\nUser: ${data.user.username}\nReal Coins: ${data.user.realCoins}`, 'success');
      fetchRequests();
      setAdminNote('');
      
      // Clear the coin value for this request after approval
      setCoinsPerRequest(prev => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
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
          <div key={request._id} className={`request-card-compact ${request.status}`}>
            <div className="request-row">
              <div className="user-icon">👤</div>
              <div className="username-compact">{request.username}</div>
              <div className="date-compact">{formatDate(request.requestDate)}</div>
              <div className={`status-badge-compact ${request.status}`}>
                {request.status.charAt(0).toUpperCase()}
              </div>
              
              {request.status === 'pending' && (
                <div className="actions-compact">
                  <span className="coins-label">Add Coins:</span>
                  <input
                    type="number"
                    className="coins-input-compact"
                    value={coinsPerRequest[request._id] || 100}
                    onChange={(e) => setCoinsPerRequest(prev => ({
                      ...prev,
                      [request._id]: Number(e.target.value)
                    }))}
                    min="0"
                    step="50"
                    title="Initial Real Coins"
                    placeholder="Amount"
                  />
                  <button
                    className="approve-btn-compact"
                    onClick={() => handleApprove(request._id)}
                    disabled={processingId === request._id}
                    title="Approve"
                  >
                    ✓
                  </button>
                  <button
                    className="reject-btn-compact"
                    onClick={() => handleReject(request._id)}
                    disabled={processingId === request._id}
                    title="Reject"
                  >
                    ✗
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSubscriptionRequests;
