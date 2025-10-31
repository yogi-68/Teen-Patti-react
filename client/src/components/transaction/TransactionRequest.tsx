import React, { useState, useEffect } from 'react';
import './TransactionRequest.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface TransactionRequestProps {
  userId: string;
  username: string;
  isSubscribed: boolean;
}

const TransactionRequest: React.FC<TransactionRequestProps> = ({ userId, isSubscribed }) => {
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

  useEffect(() => {
    if (isSubscribed) {
      fetchTransactions();
    }
  }, [userId, isSubscribed]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/transactions/user/${userId}`);
      const data = await response.json();
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

    setLoading(true);
    setError(null);

    try {
      const paymentDetails = paymentMethod === 'upi'
        ? { upiId }
        : { accountNumber, ifscCode, accountHolderName };

      const response = await fetch(`${API_URL}/transactions/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          amount: parseFloat(amount),
          paymentMethod,
          paymentDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      alert(`✅ ${type === 'deposit' ? 'Deposit' : 'Withdrawal'} request submitted successfully!\nAdmin will review your request.`);
      resetForm();
      setShowForm(false);
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setUpiId('');
    setAccountNumber('');
    setIfscCode('');
    setAccountHolderName('');
    setError(null);
  };

  if (!isSubscribed) {
    return (
      <div className="transaction-blocked">
        <div className="block-icon">🔒</div>
        <h3>Premium Feature</h3>
        <p>Deposit and withdrawal features are only available for subscribed members.</p>
        <p className="info-text">Please request a subscription to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="transaction-request-container">
      <div className="transaction-header">
        <h2>💰 Wallet Transactions</h2>
        <p>Request deposits or withdrawals for your real coin wallet</p>
      </div>

      {!showForm ? (
        <div className="transaction-actions">
          <button className="action-btn deposit-btn" onClick={() => { setType('deposit'); setShowForm(true); resetForm(); }}>
            <span className="btn-icon">⬇️</span>
            <span className="btn-text">
              <strong>Deposit</strong>
              <small>Add coins to wallet</small>
            </span>
          </button>
          <button className="action-btn withdrawal-btn" onClick={() => { setType('withdrawal'); setShowForm(true); resetForm(); }}>
            <span className="btn-icon">⬆️</span>
            <span className="btn-text">
              <strong>Withdrawal</strong>
              <small>Withdraw coins</small>
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
              <label htmlFor="amount">Amount (Real Coins):</label>
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
                    <span className="value amount">{transaction.amount} coins</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Method:</span>
                    <span className="value">{transaction.paymentMethod.toUpperCase()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{new Date(transaction.requestDate).toLocaleString()}</span>
                  </div>
                  {transaction.status === 'approved' && transaction.processedDate && (
                    <div className="detail-row">
                      <span className="label">Processed:</span>
                      <span className="value">{new Date(transaction.processedDate).toLocaleString()}</span>
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
    </div>
  );
};

export default TransactionRequest;
