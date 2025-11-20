import React, { useEffect, useState } from 'react';
import './EnquiryManagement.css';
import { apiFetch, showAlert } from '../../utils/api';

interface Enquiry {
  _id: string;
  userId: string;
  username: string;
  subject: string;
  message: string;
  status: 'pending' | 'responded' | 'resolved' | 'closed';
  adminResponse?: string;
  adminId?: string;
  adminUsername?: string;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
}

interface EnquiryManagementProps {
  adminId: string;
  adminUsername: string;
}

const EnquiryManagement: React.FC<EnquiryManagementProps> = ({ adminId, adminUsername }) => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    responded: 0,
    resolved: 0,
    closed: 0,
    total: 0,
  });

  useEffect(() => {
    fetchEnquiries();
    fetchStats();
  }, [filterStatus]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'all' 
        ? '/enquiry/admin/all' 
        : `/enquiry/admin/all?status=${filterStatus}`;
      const data = await apiFetch(url);
      setEnquiries(data.enquiries || []);
    } catch (error: any) {
      showAlert(error.message || 'Failed to fetch enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiFetch('/enquiry/admin/stats');
      setStats(data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEnquiry || !adminResponse.trim()) {
      showAlert('Please enter a response', 'error');
      return;
    }

    if (adminResponse.length < 10) {
      showAlert('Response must be at least 10 characters', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiFetch(`/enquiry/${selectedEnquiry._id}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({
          adminResponse: adminResponse.trim(),
          adminId,
          adminUsername,
        }),
      });

      showAlert('Response sent successfully!', 'success');
      setAdminResponse('');
      setSelectedEnquiry(null);
      fetchEnquiries();
      fetchStats();
    } catch (error: any) {
      showAlert(error.message || 'Failed to send response', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (enquiryId: string, newStatus: string) => {
    try {
      await apiFetch(`/enquiry/${enquiryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      showAlert(`Status updated to ${newStatus}`, 'success');
      fetchEnquiries();
      fetchStats();
    } catch (error: any) {
      showAlert(error.message || 'Failed to update status', 'error');
    }
  };

  const getSubjectLabel = (subject: string) => {
    const labels: Record<string, string> = {
      account: '👤 Account',
      payment: '💳 Payment',
      game: '🎮 Game',
      subscription: '⭐ Subscription',
      technical: '🔧 Technical',
      feedback: '💬 Feedback',
      other: '📝 Other',
    };
    return labels[subject] || subject;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#ff9800',
      responded: '#2196f3',
      resolved: '#4caf50',
      closed: '#9e9e9e',
    };
    return colors[status] || '#000';
  };

  const filteredEnquiries = enquiries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="enquiry-management">
      <div className="enquiry-header">
        <h1>📧 Help & Support Requests</h1>
        <p>Manage user enquiries and support requests</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card responded">
          <div className="stat-icon">💬</div>
          <div className="stat-value">{stats.responded}</div>
          <div className="stat-label">Responded</div>
        </div>
        <div className="stat-card resolved">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card closed">
          <div className="stat-icon">📁</div>
          <div className="stat-value">{stats.closed}</div>
          <div className="stat-label">Closed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <button
          className={filterStatus === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('all')}
          data-testid="filter-all"
        >
          All ({stats.total})
        </button>
        <button
          className={filterStatus === 'pending' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('pending')}
          data-testid="filter-pending"
        >
          Pending ({stats.pending})
        </button>
        <button
          className={filterStatus === 'responded' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('responded')}
          data-testid="filter-responded"
        >
          Responded ({stats.responded})
        </button>
        <button
          className={filterStatus === 'resolved' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('resolved')}
          data-testid="filter-resolved"
        >
          Resolved ({stats.resolved})
        </button>
        <button
          className={filterStatus === 'closed' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('closed')}
          data-testid="filter-closed"
        >
          Closed ({stats.closed})
        </button>
      </div>

      {/* Enquiries List */}
      {loading ? (
        <div className="loading">Loading enquiries...</div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="no-enquiries">
          <div className="no-enquiries-icon">📭</div>
          <div className="no-enquiries-text">No enquiries found</div>
        </div>
      ) : (
        <div className="enquiries-list">
          {filteredEnquiries.map((enquiry) => (
            <div key={enquiry._id} className="enquiry-card">
              <div className="enquiry-header-row">
                <div className="enquiry-user">
                  <span className="user-icon">👤</span>
                  <span className="username">{enquiry.username}</span>
                  <span className="user-id">#{enquiry.userId.slice(-6)}</span>
                </div>
                <div className="enquiry-meta">
                  <span className="enquiry-date">
                    {new Date(enquiry.createdAt).toLocaleDateString()} {new Date(enquiry.createdAt).toLocaleTimeString()}
                  </span>
                  <span
                    className="enquiry-status"
                    style={{ backgroundColor: getStatusColor(enquiry.status) }}
                  >
                    {enquiry.status}
                  </span>
                </div>
              </div>

              <div className="enquiry-subject">
                {getSubjectLabel(enquiry.subject)}
              </div>

              <div className="enquiry-message">
                <strong>Message:</strong>
                <p>{enquiry.message}</p>
              </div>

              {enquiry.adminResponse && (
                <div className="admin-response-box">
                  <strong>Admin Response:</strong>
                  <p>{enquiry.adminResponse}</p>
                  <div className="response-meta">
                    By {enquiry.adminUsername} • {enquiry.respondedAt && new Date(enquiry.respondedAt).toLocaleString()}
                  </div>
                </div>
              )}

              <div className="enquiry-actions">
                {!enquiry.adminResponse && (
                  <button
                    className="btn-respond"
                    onClick={() => setSelectedEnquiry(enquiry)}
                    data-testid="btn-respond"
                  >
                    💬 Respond
                  </button>
                )}
                
                <select
                  value={enquiry.status}
                  onChange={(e) => handleUpdateStatus(enquiry._id, e.target.value)}
                  className="status-select"
                  data-testid="select-status"
                >
                  <option value="pending">Pending</option>
                  <option value="responded">Responded</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedEnquiry && (
        <div className="modal-overlay" onClick={() => setSelectedEnquiry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Respond to Enquiry</h2>
              <button className="modal-close" onClick={() => setSelectedEnquiry(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="enquiry-details">
                <div className="detail-row">
                  <strong>From:</strong> {selectedEnquiry.username}
                </div>
                <div className="detail-row">
                  <strong>Subject:</strong> {getSubjectLabel(selectedEnquiry.subject)}
                </div>
                <div className="detail-row">
                  <strong>Message:</strong>
                  <p>{selectedEnquiry.message}</p>
                </div>
              </div>

              <form onSubmit={handleRespond}>
                <div className="form-group">
                  <label htmlFor="adminResponse">Your Response</label>
                  <textarea
                    id="adminResponse"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Enter your response to the user..."
                    rows={6}
                    disabled={isSubmitting}
                    required
                    data-testid="input-admin-response"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setSelectedEnquiry(null)}
                    disabled={isSubmitting}
                    data-testid="btn-cancel-response"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-send"
                    disabled={isSubmitting}
                    data-testid="btn-send-response"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryManagement;
