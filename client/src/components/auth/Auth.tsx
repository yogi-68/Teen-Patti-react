import { useState } from 'react';
import './Auth.css';

interface AuthProps {
  onLogin: (username: string, coins: number, userId: string, cashBalance: number, isAdmin?: boolean, isSubscribed?: boolean, practiceCoins?: number, realCoins?: number, hasSeenTour?: boolean) => void;
}

type AuthMode = 'login' | 'register';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  userId?: string; // Store temporarily for disclaimer
}

interface FormErrors {
  username?: string;
  email?: string;
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
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
          password: formData.password
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
        data.user.practiceCoins || 50,
        data.user._id,
        data.user.realCoins || 0,
        data.user.isAdmin || false,
        data.user.isSubscribed || false,
        data.user.practiceCoins || 50,
        data.user.realCoins || 0,
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
    
    // Fetch user data from database
    if (formData.userId) {
      try {
        const response = await fetch(`${API_URL}/users/${formData.userId}`);
        const data = await response.json();
        
        if (data.user) {
          onLogin(
            data.user.username,
            data.user.practiceCoins || 50,
            data.user._id,
            data.user.realCoins || 0,
            data.user.isAdmin || false,
            data.user.isSubscribed || false,
            data.user.practiceCoins || 50,
            data.user.realCoins || 0,
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
      password: '',
      confirmPassword: '',
    });
  };

  const handleGuestPlay = async () => {
    const guestName = `Guest${Math.floor(Math.random() * 10000)}`;
    
    try {
      // Create guest user in database (no password required)
      const response = await fetch(`${API_URL}/users/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: guestName })
      });

      const data = await response.json();
      
      if (data.user) {
        onLogin(
          data.user.username,
          data.user.practiceCoins || 50,
          data.user._id,
          data.user.realCoins || 0,
          false,
          data.user.isSubscribed || false,
          data.user.practiceCoins || 50,
          data.user.realCoins || 0,
          data.user.hasSeenTour || false
        );
      } else {
        // Fallback without database
        onLogin(guestName, 50, '', 0, false, false, 50, 0, false);
      }
    } catch (error) {
      console.error('Guest login error:', error);
      // Fallback without database
      onLogin(guestName, 100, '', 0, false, false, 50, 0);
    }
  };

  const handleSocialLogin = (provider: string) => {
    alert(`${provider} login coming soon!`);
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

          {/* Social Login */}
          <div className="social-login">
            <button className="social-btn google" onClick={() => handleSocialLogin('Google')}>
              <span className="social-icon">🔍</span>
              Continue with Google
            </button>
          </div>

          <div className="divider">
            <span>OR</span>
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

                {/* Register two-column: Password | Confirm Password */}
                <div className="form-row">
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
                  Virtual coins purchased or earned on this platform are non-refundable. 
                  Once coins are added to your account, they cannot be exchanged for cash or 
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Auth;
