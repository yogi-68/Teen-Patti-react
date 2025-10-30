import { useState } from 'react';
import './Auth.css';

interface AuthProps {
  onLogin: (username: string, coins: number) => void;
}

type AuthMode = 'login' | 'register';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

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
    if (mode === 'register' && password.length < 8) return 'Password should be at least 8 characters for security';
    return undefined;
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) return { strength: 1, label: 'Weak', color: '#ff4444' };
    if (strength <= 3) return { strength: 2, label: 'Medium', color: '#ffa500' };
    return { strength: 3, label: 'Strong', color: '#00cc00' };
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
    newErrors.email = validateEmail(formData.email);
    newErrors.password = validatePassword(formData.password);
    
    if (mode === 'register') {
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
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      // Check if first time user (for disclaimer)
      const hasAcceptedDisclaimer = localStorage.getItem('disclaimerAccepted');
      
      if (!hasAcceptedDisclaimer) {
        setShowDisclaimer(true);
      } else {
        // Proceed to dashboard
        onLogin(formData.username, 10000);
      }
    }, 1000);
  };

  const handleDisclaimerAccept = () => {
    if (!disclaimerAccepted) {
      return;
    }
    localStorage.setItem('disclaimerAccepted', 'true');
    setShowDisclaimer(false);
    onLogin(formData.username, 10000);
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

  const handleGuestPlay = () => {
    const guestName = `Guest${Math.floor(Math.random() * 10000)}`;
    onLogin(guestName, 5000);
  };

  const handleSocialLogin = (provider: string) => {
    alert(`${provider} login coming soon!`);
  };

  const passwordStrength = mode === 'register' && formData.password ? getPasswordStrength(formData.password) : null;

  return (
    <>
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo & Title */}
          <div className="auth-header">
            <div className="auth-logo">🎴</div>
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
            <button className="social-btn apple" onClick={() => handleSocialLogin('Apple')}>
              <span className="social-icon">🍎</span>
              Continue with Apple
            </button>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Username */}
            <div className="form-group">
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

            {/* Email (Register only) */}
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="email">
                  Email <span className="optional">(Optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className={errors.email ? 'error' : ''}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  disabled={loading}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            )}

            {/* Password */}
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
              
              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: `${(passwordStrength.strength / 3) * 100}%`,
                        backgroundColor: passwordStrength.color 
                      }}
                    ></div>
                  </div>
                  <span className="strength-label" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div className="form-group">
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
            )}

            {/* Terms Checkbox (Register only) */}
            {mode === 'register' && (
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
            <p className="guest-note">Start with 5,000 practice coins</p>
          </div>

          {/* Footer Note */}
          <div className="auth-footer">
            <p className="footer-note">
              🔒 Secure & Safe • 18+ Only • For Entertainment
            </p>
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
