import React, { useState, useEffect } from 'react';
import { apiFetch, showAlert } from '../../utils/api';

interface BotComplaint {
  id: number;
  table_id: number;
  seat_index: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reported_by: string;
  reported_at: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  resolution_notes?: string;
  resolved_at?: string;
}

interface ComplaintFormData {
  table_id: string;
  seat_index: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const ComplaintTracker: React.FC = () => {
  const [complaints, setComplaints] = useState<BotComplaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ComplaintFormData>({
    table_id: '',
    seat_index: '',
    description: '',
    severity: 'medium'
  });

  // Fetch complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const data = await apiFetch<BotComplaint[]>('/admin/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch complaints');
      showAlert(err.message || 'Failed to fetch complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const tableId = parseInt(formData.table_id);
    const seatIndex = parseInt(formData.seat_index);
    
    if (isNaN(tableId) || tableId < 1 || tableId > 100) {
      setError('Table ID must be between 1 and 100');
      return;
    }
    
    if (isNaN(seatIndex) || seatIndex < 0 || seatIndex > 5) {
      setError('Seat index must be between 0 and 5');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      await apiFetch('/admin/complaints', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          table_id: tableId,
          seat_index: seatIndex,
          description: formData.description.trim(),
          severity: formData.severity
        })
      });
      
      // Reset form
      setFormData({
        table_id: '',
        seat_index: '',
        description: '',
        severity: 'medium'
      });
      setShowForm(false);
      setError(null);
      showAlert('Complaint submitted successfully', 'success');
      
      // Refresh complaints
      await fetchComplaints();
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint');
      showAlert(err.message || 'Failed to submit complaint', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update complaint status
  const updateComplaintStatus = async (complaintId: number, status: string, notes?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      await apiFetch(`/admin/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status,
          resolution_notes: notes
        })
      });
      
      await fetchComplaints();
      setError(null);
      showAlert('Complaint status updated', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to update complaint');
      showAlert(err.message || 'Failed to update complaint', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Bot Complaint Tracker</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          disabled={loading}
        >
          {showForm ? 'Cancel' : '+ Report Issue'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Complaint Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Report Bot Issue</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Table ID</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.table_id}
                  onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1-100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Seat Index</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.seat_index}
                  onChange={(e) => setFormData({ ...formData, seat_index: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0-5"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low - Minor issue</option>
                <option value="medium">Medium - Noticeable problem</option>
                <option value="high">High - Serious issue</option>
                <option value="critical">Critical - Game-breaking</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe the issue with the bot behavior..."
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {loading && !showForm && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading complaints...</p>
          </div>
        )}

        {!loading && complaints.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No complaints reported yet.
          </div>
        )}

        {complaints.map((complaint) => (
          <div
            key={complaint.id}
            className={`p-4 border rounded-lg ${getSeverityColor(complaint.severity)} transition`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">
                    Table {complaint.table_id}, Seat {complaint.seat_index}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(complaint.status)}`}>
                    {complaint.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{complaint.description}</p>
                <div className="text-xs text-gray-600">
                  Reported by {complaint.reported_by} on{' '}
                  {new Date(complaint.reported_at).toLocaleString()}
                </div>
                {complaint.resolution_notes && (
                  <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-sm">
                    <strong>Resolution:</strong> {complaint.resolution_notes}
                  </div>
                )}
              </div>
            </div>

            {complaint.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => updateComplaintStatus(complaint.id, 'investigating')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  Investigate
                </button>
                <button
                  onClick={() => {
                    const notes = prompt('Resolution notes:');
                    if (notes) updateComplaintStatus(complaint.id, 'resolved', notes);
                  }}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={loading}
                >
                  Resolve
                </button>
                <button
                  onClick={() => {
                    const notes = prompt('Dismissal reason:');
                    if (notes) updateComplaintStatus(complaint.id, 'dismissed', notes);
                  }}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  disabled={loading}
                >
                  Dismiss
                </button>
              </div>
            )}

            {complaint.status === 'investigating' && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    const notes = prompt('Resolution notes:');
                    if (notes) updateComplaintStatus(complaint.id, 'resolved', notes);
                  }}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={loading}
                >
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintTracker;
