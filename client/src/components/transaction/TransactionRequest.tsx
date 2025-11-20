import React, { useState, useEffect } from 'react';
import './TransactionRequest.css';
import { apiFetch, showAlert, formatDate } from '../../utils/api';

interface TransactionRequestProps {
  userId: string;
  realCoins: number;
  isSubscribed: boolean;
}

const TransactionRequest: React.FC<TransactionRequestProps> = ({ userId, realCoins, isSubscribed }) => {
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [withdrawalCommission, setWithdrawalCommission] = useState<number>(40); // Default 40%

  useEffect(() => {
    fetchTransactions();
    fetchWithdrawalCommission();
  }, [userId]);

  const fetchWithdrawalCommission = async () => {
    try {
      const data = await apiFetch('/settings/withdrawalCommission');
      if (data.success && data.data) {
        setWithdrawalCommission(data.data.value || 40);
      }
    } catch (err) {
      console.error('Error fetching withdrawal commission:', err);
      // Keep default 40% if fetch fails
    }
  };

  const fetchTransactions = async () => {
    try {
      const data = await apiFetch(`/transactions/user/${userId}`);
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Check withdrawal balance with platform fee
    if (type === 'withdrawal') {
      const requestedAmount = parseFloat(amount);
      const fee = requestedAmount * (withdrawalCommission / 100);
      const totalNeeded = requestedAmount; // User needs full amount in balance
      
      if (totalNeeded > realCoins) {
        setError(`Insufficient balance! You need ₹${totalNeeded.toFixed(2)} in your wallet. After ${withdrawalCommission}% fee (₹${fee.toFixed(2)}), you will receive ₹${(requestedAmount - fee).toFixed(2)}. You have ₹${realCoins} available.`);
        return;
      }
    }

    if (paymentMethod === 'upi' && !upiId.trim()) {
      setError('Please enter your UPI ID');
      return;
    }

    if (paymentMethod === 'bank') {
      if (!accountNumber.trim() || !ifscCode.trim() || !accountHolderName.trim()) {
        setError('Please fill all bank account details');
        return;
      }
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);

    try {
      const paymentDetails = paymentMethod === 'upi'
        ? { upiId }
        : { accountNumber, ifscCode, accountHolderName };

      // For withdrawals, calculate net amount after platform fee
      const requestedAmount = parseFloat(amount);
      const finalAmount = type === 'withdrawal' 
        ? requestedAmount - (requestedAmount * (withdrawalCommission / 100))
        : requestedAmount;

      await apiFetch('/transactions/request', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          type,
          amount: finalAmount, // Send net amount (₹97 for ₹100 withdrawal)
          paymentMethod,
          paymentDetails,
        }),
      });

      const successMsg = `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} request submitted successfully!\nAdmin will review your request.`;
      showAlert(successMsg, 'success');
      resetForm();
      setShowForm(false);
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
  };

  const checkSubscription = (transactionType: 'deposit' | 'withdrawal'): boolean => {
    if (!isSubscribed) {
      const action = transactionType === 'deposit' ? 'deposits' : 'withdrawals';
      showAlert(`You must subscribe to make ${action}.\nPlease go to your Profile page to subscribe.`, 'error');
      return false;
    }
    return true;
  };

  const handleTransactionClick = (transactionType: 'deposit' | 'withdrawal') => {
    if (!checkSubscription(transactionType)) {
      return;
    }
    setType(transactionType);
    setShowForm(true);
    resetForm();
  };

  const resetForm = () => {
    setAmount('');
    setUpiId('');
    setAccountNumber('');
    setIfscCode('');
    setAccountHolderName('');
    setError(null);
  };

  return (
    <div className="transaction-request-container">
      {!showForm ? (
        <div className="transaction-actions">
          <button className="action-btn deposit-btn" onClick={() => handleTransactionClick('deposit')}>
            <span className="btn-icon">⬇️</span>
            <span className="btn-text">
              <strong>Deposit</strong>
              <small>Add cash to wallet</small>
            </span>
          </button>
          <button className="action-btn withdrawal-btn" onClick={() => handleTransactionClick('withdrawal')}>
            <span className="btn-icon">⬆️</span>
            <span className="btn-text">
              <strong>Withdrawal</strong>
              <small>Withdraw cash</small>
            </span>
          </button>
        </div>
      ) : (
        <div className="transaction-form-container">
          <div className="form-header">
            <h3>{type === 'deposit' ? '⬇️ Deposit Request' : '⬆️ Withdrawal Request'}</h3>
            <button className="close-btn" onClick={() => { setShowForm(false); resetForm(); }}>✕</button>
          </div>

          <form className="transaction-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="amount">{type === 'withdrawal' ? 'Withdrawal Amount (₹):' : 'Deposit Amount (₹):'}</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                step="1"
                required
              />
              {type === 'withdrawal' && amount && parseFloat(amount) > 0 && (
                <div className="withdrawal-fee-info">
                  <div className="fee-breakdown">
                    <div className="fee-row">
                      <span>Withdrawal Amount:</span>
                      <span className="fee-value">₹{parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="fee-row fee-charge">
                      <span>Platform Fee ({withdrawalCommission}%):</span>
                      <span className="fee-value">₹{(parseFloat(amount) * (withdrawalCommission / 100)).toFixed(2)}</span>
                    </div>
                    <div className="fee-row receive">
                      <span><strong>You Will Receive:</strong></span>
                      <span className="fee-value receive-amount"><strong>₹{(parseFloat(amount) * (1 - withdrawalCommission / 100)).toFixed(2)}</strong></span>
                    </div>
                  </div>
                  <p className="fee-note">💡 A {withdrawalCommission}% platform fee is charged on all withdrawals</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Payment Method:</label>
              <div className="payment-methods">
                <label className={`method-option ${paymentMethod === 'upi' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'upi')}
                  />
                  <span>UPI</span>
                </label>
                <label className={`method-option ${paymentMethod === 'bank' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    value="bank"
                    checked={paymentMethod === 'bank'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'bank')}
                  />
                  <span>Bank Account</span>
                </label>
              </div>
            </div>

            {paymentMethod === 'upi' ? (
              <div className="form-group">
                <label htmlFor="upiId">UPI ID:</label>
                <input
                  type="text"
                  id="upiId"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  required
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="accountHolderName">Account Holder Name:</label>
                  <input
                    type="text"
                    id="accountHolderName"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Full name as per bank"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="accountNumber">Account Number:</label>
                  <input
                    type="text"
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Your account number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ifscCode">IFSC Code:</label>
                  <input
                    type="text"
                    id="ifscCode"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="Bank IFSC code"
                    required
                  />
                </div>
              </>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Submitting...' : `Submit ${type === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
              </button>
            </div>

            <p className="form-note">
              💡 Admin will review and process your request within 24-48 hours.
            </p>
          </form>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="transactions-history">
          <h3>📋 Transaction History</h3>
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction._id} className={`transaction-card ${transaction.status}`}>
                <div className="transaction-header-row">
                  <div className="transaction-type">
                    <span className="type-icon">{transaction.type === 'deposit' ? '⬇️' : '⬆️'}</span>
                    <strong>{transaction.type.toUpperCase()}</strong>
                  </div>
                  <div className={`transaction-status status-${transaction.status}`}>
                    {transaction.status}
                  </div>
                </div>
                <div className="transaction-details">
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value amount">₹{transaction.amount}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Method:</span>
                    <span className="value">{transaction.paymentMethod.toUpperCase()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(transaction.requestDate)}</span>
                  </div>
                  {transaction.status === 'approved' && transaction.processedDate && (
                    <div className="detail-row">
                      <span className="label">Processed:</span>
                      <span className="value">{formatDate(transaction.processedDate)}</span>
                    </div>
                  )}
                  {transaction.status === 'rejected' && transaction.adminRemarks && (
                    <div className="admin-remarks">
                      <strong>Admin remarks:</strong> {transaction.adminRemarks}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={handleCancelConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Confirm {type === 'deposit' ? 'Deposit' : 'Withdrawal'} Request</h3>
              <button className="modal-close" onClick={handleCancelConfirm}>✕</button>
            </div>
            <div className="modal-body">
              <div className="confirm-details">
                <div className="confirm-row">
                  <span className="confirm-label">Type:</span>
                  <span className="confirm-value">{type.toUpperCase()}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Amount:</span>
                  <span className="confirm-value amount">₹{amount}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Payment Method:</span>
                  <span className="confirm-value">{paymentMethod.toUpperCase()}</span>
                </div>
                {paymentMethod === 'upi' ? (
                  <div className="confirm-row">
                    <span className="confirm-label">UPI ID:</span>
                    <span className="confirm-value">{upiId}</span>
                  </div>
                ) : (
                  <>
                    <div className="confirm-row">
                      <span className="confirm-label">Account Holder:</span>
                      <span className="confirm-value">{accountHolderName}</span>
                    </div>
                    <div className="confirm-row">
                      <span className="confirm-label">Account Number:</span>
                      <span className="confirm-value">{accountNumber}</span>
                    </div>
                    <div className="confirm-row">
                      <span className="confirm-label">IFSC Code:</span>
                      <span className="confirm-value">{ifscCode}</span>
                    </div>
                  </>
                )}
                {type === 'withdrawal' && (
                  <div className="confirm-row balance-info">
                    <span className="confirm-label">Current Balance:</span>
                    <span className="confirm-value">₹{realCoins}</span>
                  </div>
                )}
              </div>
              <p className="confirm-note">
                💡 Your request will be sent to the admin for review. You'll be notified once it's processed.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn cancel" onClick={handleCancelConfirm}>
                Cancel
              </button>
              <button className="modal-btn confirm" onClick={handleConfirmSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionRequest;
