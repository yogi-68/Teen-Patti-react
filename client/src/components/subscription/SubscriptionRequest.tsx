import React, { useState, useEffect } from 'react';
import './SubscriptionRequest.css';
import { apiFetch, showAlert, validateRequired, formatDate } from '../../utils/api';

interface SubscriptionRequestProps {
  userId: string;
  username: string;
}

const SubscriptionRequest: React.FC<SubscriptionRequestProps> = ({ userId }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    try {
      const data = await apiFetch(`/subscription/status/${userId}`);
      setStatus(data);
    } catch (err) {
      console.error('Error checking subscription status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateRequired({ message: message.trim() });
    if (validationError) {
      setError('Please enter a message for your subscription request');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiFetch('/subscription/request', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          message: message.trim(),
        }),
      });

      showAlert('Subscription request submitted successfully!\nAdmin will review your request.', 'success');
      setMessage('');
      checkStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status?.isSubscribed) {
    return (
      <div className="subscription-status subscribed">
        <div className="status-icon">⭐</div>
        <h3>Premium Member</h3>
        <p>You are subscribed! Enjoy all premium features.</p>
        <div className="subscription-date">
          Member since: {new Date(status.subscriptionDate).toLocaleDateString()}
        </div>
      </div>
    );
  }

  if (status?.latestRequest?.status === 'pending') {
    return (
      <div className="subscription-status pending">
        <div className="status-icon">⏳</div>
        <h3>Request Pending</h3>
        <p>Your subscription request is being reviewed by admin.</p>
        <div className="request-details">
          <p><strong>Your message:</strong></p>
          <p className="user-message">{status.latestRequest.message}</p>
          <p className="request-date">
            Submitted: {formatDate(status.latestRequest.requestDate)}
          </p>
        </div>
        <p className="info-text">You'll be notified once admin reviews your request.</p>
      </div>
    );
  }

  if (status?.latestRequest?.status === 'rejected') {
    return (
      <div className="subscription-status rejected">
        <div className="status-icon">❌</div>
        <h3>Request Rejected</h3>
        <p>Your previous subscription request was not approved.</p>
        {status.latestRequest.adminNote && (
          <div className="admin-note">
            <strong>Admin note:</strong> {status.latestRequest.adminNote}
          </div>
        )}
        <button className="submit-new-btn" onClick={() => setStatus({ ...status, latestRequest: null })}>
          Submit New Request
        </button>
      </div>
    );
  }

  return (
    <div className="subscription-request-container">
      <div className="subscription-info">
        <div className="info-icon">⭐</div>
        <h2>Request Premium Subscription</h2>
        <p>Get access to exclusive features:</p>
        <ul className="features-list">
          <li>✅ Play real-coin games (Teen Patti real mode)</li>
          <li>✅ Access to Roulette game</li>
          <li>✅ Deposit and withdrawal features</li>
          <li>✅ Real coin wallet management</li>
          <li>✅ Priority support</li>
        </ul>
      </div>

      <form className="request-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="message">Tell us why you want to subscribe:</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here (e.g., I want to play real-coin games and use wallet features)"
            rows={5}
            maxLength={500}
            required
          />
          <span className="char-count">{message.length}/500</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>

        <p className="note">
          💡 Admin will review your request and may contact you for payment details.
        </p>
      </form>
    </div>
  );
};

export default SubscriptionRequest;
