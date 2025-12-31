import { useState, useEffect } from 'react';
import './Auth.css';

interface AuthProps {
  onLogin: (username: string, coins: number, userId: string, tokenBalance: number, isAdmin?: boolean, isSubscribed?: boolean, practiceTrial?: number, realToken?: number, hasSeenTour?: boolean) => void;
}

type AuthMode = 'login' | 'register';

interface FormData {
  username: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
  userId?: string; // Store temporarily for disclaimer
}

interface FormErrors {
  username?: string;
  email?: string;
  mobile?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSubscriptionInfo, setShowSubscriptionInfo] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordIdentifier, setForgotPasswordIdentifier] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  // Check for referral code in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode.toUpperCase() }));
      setMode('register'); // Switch to register mode if referral code present
    }
  }, []);

  const validateUsername = (username: string): string | undefined => {
    if (!username.trim()) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (mode === 'register' && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Invalid email format';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  const validateMobile = (mobile: string): string | undefined => {
    if (!mobile) return undefined; // Optional for login
    if (!/^[0-9]{10}$/.test(mobile)) return 'Mobile number must be 10 digits';
    return undefined;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: FormErrors = {};
    newErrors.username = validateUsername(formData.username);
    newErrors.password = validatePassword(formData.password);
    
    if (mode === 'register') {
      // Email is required for registration
      newErrors.email = validateEmail(formData.email);
      if (!formData.email) {
        newErrors.email = 'Email is required';
      }
      // Mobile is required for registration
      newErrors.mobile = validateMobile(formData.mobile);
      if (!formData.mobile) {
        newErrors.mobile = 'Mobile number is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!agreedToTerms) {
        newErrors.general = 'You must agree to the Terms & Disclaimer';
      }
    }

    if (Object.values(newErrors).some(error => error)) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    try {
      // Determine if this is login or register
      const endpoint = mode === 'register' ? '/users/register' : '/users/login';
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: formData.username,
          email: mode === 'register' ? formData.email : undefined,
          mobile: mode === 'register' ? formData.mobile : undefined,
          password: formData.password,
          referralCode: mode === 'register' && formData.referralCode ? formData.referralCode : undefined
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Server error:', data.error);
        setErrors({ general: data.error || `${mode === 'login' ? 'Login' : 'Registration'} failed` });
        setLoading(false);
        return;
      }

      if (!data.user) {
        console.error('❌ No user data in response');
        setErrors({ general: 'Invalid response from server' });
        setLoading(false);
        return;
      }

      setLoading(false);
      
      // Only show disclaimer for NEW registrations, not for logins
      if (mode === 'register') {
        // Check if user has already accepted disclaimer (in case of re-registration)
        const hasAcceptedDisclaimer = localStorage.getItem('disclaimerAccepted');
        
        if (!hasAcceptedDisclaimer) {
          // Store user data temporarily
          setFormData(prev => ({ ...prev, userId: data.user._id }));
          setShowDisclaimer(true);
          return; // Wait for disclaimer acceptance before proceeding
        }
      }
      
      // For login OR if disclaimer already accepted, proceed to dashboard
      onLogin(
        data.user.username,
        data.user.practiceTrial || 50,
        data.user._id,
        data.user.realToken || 0,
        data.user.isAdmin || false,
        data.user.isSubscribed || false,
        data.user.practiceTrial || 50,
        data.user.realToken || 0,
        data.user.hasSeenTour || false
      );
      
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ API_URL being used:', API_URL);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to server';
      setErrors({ general: `Connection error: ${errorMessage}. API URL: ${API_URL}` });
      setLoading(false);
    }
  };

  const handleDisclaimerAccept = async () => {
    if (!disclaimerAccepted) {
      return;
    }
    localStorage.setItem('disclaimerAccepted', 'true');
    setShowDisclaimer(false);
    
    // Show subscription info popup for new users
    setShowSubscriptionInfo(true);
  };

  const handleSubscriptionInfoClose = async () => {
    setShowSubscriptionInfo(false);
    
    // Fetch user data from database and proceed to login
    if (formData.userId) {
      try {
        const response = await fetch(`${API_URL}/users/${formData.userId}`);
        const data = await response.json();
        
        if (data.user) {
          onLogin(
            data.user.username,
            data.user.practiceTrial || 50,
            data.user._id,
            data.user.realToken || 0,
            data.user.isAdmin || false,
            data.user.isSubscribed || false,
            data.user.practiceTrial || 50,
            data.user.realToken || 0,
            data.user.hasSeenTour || false
          );
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // Fallback with stored username
        onLogin(formData.username, 100, formData.userId, 0, false, false, 50, 0, false);
      }
    } else {
      // Fallback
      onLogin(formData.username, 100, '', 0, false, false, 50, 0, false);
    }
  };

  const handleDisclaimerDecline = () => {
    setShowDisclaimer(false);
    setFormData({
      username: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      referralCode: '',
    });
  };

  const handleGuestPlay = async () => {
    const guestName = `Guest${Math.floor(Math.random() * 10000)}`;
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create guest user in database (no password required)
      const response = await fetch(`${API_URL}/users/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: guestName })
      });

      const data = await response.json();
      
      if (data.user && data.user._id) {
        // Use actual guest user ID from database
        onLogin(
          data.user.username,
          data.user.practiceTrial || 50,
          data.user._id,
          data.user.realToken || 0,
          false,
          data.user.isSubscribed || false,
          data.user.practiceTrial || 50,
          data.user.realToken || 0,
          data.user.hasSeenTour || false
        );
      } else {
        // Fallback with generated guest ID
        console.warn('⚠️ Guest user not created in DB, using temporary ID');
        onLogin(guestName, 50, guestId, 0, false, false, 50, 0, false);
      }
    } catch (error) {
      console.error('Guest login error:', error);
      // Fallback with generated guest ID
      console.warn('⚠️ Guest login failed, using temporary ID');
      onLogin(guestName, 50, guestId, 0, false, false, 50, 0, false);
    }
  };

  return (
    <>
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo & Title */}
          <div className="auth-header">
            <h1 className="auth-title">Teen Patti</h1>
            <p className="auth-subtitle">Premium Card Gaming Experience</p>
          </div>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Login: inline label-input rows. Register: two-column rows */}
            {mode === 'login' ? (
              <>
                <div className="form-group">
                  <label htmlFor="username">Username or Email</label>
                  <input
                    id="username"
                    type="text"
                    className={errors.username ? 'error' : ''}
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter username or email"
                    disabled={loading}
                  />
                  {errors.username && <span className="error-message">{errors.username}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    className={errors.password ? 'error' : ''}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="forgot-password-container">
                  <a href="#" className="forgot-password-link" onClick={(e) => {
                    e.preventDefault();
                    setShowForgotPassword(true);
                  }}>
                    Forgot Password?
                  </a>
                </div>
              </>
            ) : (
              <>
                {/* Register two-column: Username | Email */}
                <div className="form-row">
                  <div className="form-item">
                    <label htmlFor="username">Username</label>
                    <input
                      id="username"
                      type="text"
                      className={errors.username ? 'error' : ''}
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="Enter your username"
                      disabled={loading}
                    />
                    {errors.username && <span className="error-message">{errors.username}</span>}
                  </div>

                  <div className="form-item">
                    <label htmlFor="email">Email <span className="required">*</span></label>
                    <input
                      id="email"
                      type="email"
                      className={errors.email ? 'error' : ''}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      disabled={loading}
                      required
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                </div>

                {/* Register two-column: Mobile | Password */}
                <div className="form-row">
                  <div className="form-item">
                    <label htmlFor="mobile">Mobile Number <span className="required">*</span></label>
                    <input
                      id="mobile"
                      type="tel"
                      className={errors.mobile ? 'error' : ''}
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      placeholder="10-digit mobile number"
                      disabled={loading}
                      required
                      maxLength={10}
                    />
                    {errors.mobile && <span className="error-message">{errors.mobile}</span>}
                  </div>

                  <div className="form-item">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      className={errors.password ? 'error' : ''}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}
                  </div>
                </div>

                {/* Register: Confirm Password */}
                <div className="form-row">
                  <div className="form-item">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      className={errors.confirmPassword ? 'error' : ''}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      disabled={loading}
                    />
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                  </div>
                </div>

                {/* Referral Code (Optional) */}
                <div className="form-group">
                  <label htmlFor="referralCode">Referral Code (Optional)</label>
                  <input
                    id="referralCode"
                    type="text"
                    className=""
                    value={formData.referralCode}
                    onChange={(e) => handleInputChange('referralCode', e.target.value.toUpperCase())}
                    placeholder="Enter referral code (e.g., REF123ABC)"
                    disabled={loading}
                    maxLength={9}
                  />
                  <span className="input-hint">Have a referral code? Enter it to get bonus trial on deposits!</span>
                </div>

                {/* Terms Checkbox (Register only) */}
                <div className="form-group-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      disabled={loading}
                    />
                    <span>By continuing you agree to our <a href="#terms" className="link">Terms & Disclaimer</a></span>
                  </label>
                </div>
              </>
            )}

            {/* General Error */}
            {errors.general && <div className="error-message general">{errors.general}</div>}

            {/* Submit Button */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <span className="loading-spinner">⏳</span>
              ) : mode === 'login' ? (
                'Login'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Guest Play */}
          <div className="guest-play">
            <button className="btn-guest" onClick={handleGuestPlay} disabled={loading}>
              🎮 Play as Guest (Practice Mode)
            </button>
          </div>

          
        </div>
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="disclaimer-overlay">
          <div className="disclaimer-modal">
            <div className="disclaimer-header">
              <h2>⚠️ Important Disclaimer</h2>
              <p className="disclaimer-subtitle">Please read carefully before continuing</p>
            </div>

            <div className="disclaimer-content">
              <div className="disclaimer-section">
                <h3>🎮 Entertainment Only</h3>
                <p>
                  This platform is designed for entertainment purposes only. All games, coins, and 
                  rewards are virtual and hold no real-world monetary value.
                </p>
              </div>

              <div className="disclaimer-section">
                <h3>💰 No Refunds Policy</h3>
                <p>
                  Virtual trial purchased or earned on this platform are non-refundable. 
                  Once trial are added to your account, they cannot be exchanged for token or 
                  transferred to other users.
                </p>
              </div>

              <div className="disclaimer-section">
                <h3>🔞 Age Requirement</h3>
                <p>
                  You must be at least 18 years of age to use this platform. By accepting this 
                  disclaimer, you confirm that you meet this age requirement and have the legal 
                  capacity to enter into this agreement.
                </p>
              </div>

              <div className="disclaimer-section">
                <h3>💳 Manual Transactions</h3>
                <p>
                  All real-money transactions (deposits and withdrawals) are processed manually 
                  by our Admin team. Processing times may vary. Contact support for assistance 
                  with transactions.
                </p>
              </div>

              <div className="disclaimer-section warning">
                <h3>⚠️ Responsible Gaming</h3>
                <p>
                  Please play responsibly. If you feel you have a gambling problem, seek help 
                  immediately. This platform promotes responsible gaming practices.
                </p>
              </div>
            </div>

            <div className="disclaimer-footer">
              <label className="disclaimer-checkbox">
                <input
                  type="checkbox"
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                />
                <span>
                  I confirm that I am 18+ years old and agree to all terms mentioned above
                </span>
              </label>

              <div className="disclaimer-actions">
                <button 
                  className="btn-decline" 
                  onClick={handleDisclaimerDecline}
                >
                  Decline
                </button>
                <button 
                  className="btn-agree" 
                  onClick={handleDisclaimerAccept}
                  disabled={!disclaimerAccepted}
                >
                  I Agree & Continue
                </button>
              </div>
              <p style={{ fontSize: '10px', color: '#666', marginTop: '12px', textAlign: 'center' }}>Developed by Yogi</p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Info Popup for New Users */}
      {showSubscriptionInfo && (
        <div className="modal-overlay">
          <div className="modal-container subscription-info-modal">
            <div className="modal-header">
              <h2>� Welcome to Teen Patti!</h2>
            </div>
            <div className="modal-body">
              <div className="subscription-welcome">
                <p className="welcome-text">
                  Your account is ready! Start playing now.
                </p>
                
                <div className="subscription-explainer">
                  <h3>🎮 Two Game Modes:</h3>
                  <div className="game-modes">
                    <div className="mode-info">
                      <span className="mode-icon">🪙</span>
                      <div>
                        <strong>Practice Mode</strong>
                        <p>Play now with free trial</p>
                      </div>
                    </div>
                    <div className="mode-info">
                      <span className="mode-icon">💰</span>
                      <div>
                        <strong>Real Token Mode</strong>
                        <p>Requires premium subscription</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="subscription-note">
                    <strong>To unlock real token:</strong> Go to Profile → Request Subscription
                  </div>
                </div>
              </div>

              <button 
                className="btn-continue" 
                onClick={handleSubscriptionInfoClose}
              >
                Start Playing 🎮
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => {
          setShowForgotPassword(false);
          setForgotPasswordIdentifier('');
          setForgotPasswordMessage('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔐 Forgot Password</h2>
              <button 
                className="btn-close" 
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordIdentifier('');
                  setForgotPasswordMessage('');
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="forgot-password-info">
                Enter your username or email address to submit a password reset request. 
                An admin will review your request and reset your password.
              </p>

              <div className="form-group">
                <label htmlFor="forgot-identifier">Username or Email</label>
                <input
                  id="forgot-identifier"
                  type="text"
                  value={forgotPasswordIdentifier}
                  onChange={(e) => setForgotPasswordIdentifier(e.target.value)}
                  placeholder="Enter your username or email"
                  disabled={forgotPasswordLoading}
                />
              </div>

              {forgotPasswordMessage && (
                <div className={`forgot-password-message ${forgotPasswordMessage.includes('success') ? 'success' : 'error'}`}>
                  {forgotPasswordMessage}
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordIdentifier('');
                    setForgotPasswordMessage('');
                  }}
                  disabled={forgotPasswordLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-submit-reset"
                  onClick={async () => {
                    if (!forgotPasswordIdentifier.trim()) {
                      setForgotPasswordMessage('Please enter your username or email');
                      return;
                    }

                    setForgotPasswordLoading(true);
                    setForgotPasswordMessage('');

                    try {
                      const response = await fetch(`${API_URL}/password-reset/request`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          userIdentifier: forgotPasswordIdentifier,
                          requestType: 'login'
                        })
                      });

                      const data = await response.json();

                      if (response.ok) {
                        setForgotPasswordMessage('Password reset request submitted successfully! Admin will review your request.');
                        setTimeout(() => {
                          setShowForgotPassword(false);
                          setForgotPasswordIdentifier('');
                          setForgotPasswordMessage('');
                        }, 3000);
                      } else {
                        setForgotPasswordMessage(data.error || 'Failed to submit request');
                      }
                    } catch (error) {
                      setForgotPasswordMessage('Failed to connect to server');
                    } finally {
                      setForgotPasswordLoading(false);
                    }
                  }}
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Auth;
