import { useState } from 'react';
import './SettingsPage.css';
import { apiFetch, showAlert } from '../../utils/api';

interface SettingsPageProps {
  username: string;
  userId: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userId, username }) => {
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Forgot password state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  // Token Transfer PIN change state
  const [showPinChangeModal, setShowPinChangeModal] = useState(false);
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  
  // OTP for forgot PIN
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpNewPin, setOtpNewPin] = useState('');
  const [otpConfirmPin, setOtpConfirmPin] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

  // Audio settings state
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(() => {
    const saved = localStorage.getItem('backgroundMusicEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEffectsEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  const handleMusicToggle = async () => {
    const newValue = !backgroundMusicEnabled;
    setBackgroundMusicEnabled(newValue);
    
    // Dynamically import SoundManager to avoid circular dependencies
    const SoundManager = (await import('../../utils/SoundManager')).default;
    SoundManager.setMusicEnabled(newValue);
    
    showAlert(
      newValue ? '🎵 Background music enabled' : '🔇 Background music disabled',
      'success'
    );
  };

  const handleSoundToggle = async () => {
    const newValue = !soundEffectsEnabled;
    setSoundEffectsEnabled(newValue);
    
    const SoundManager = (await import('../../utils/SoundManager')).default;
    SoundManager.setSoundEnabled(newValue);
    
    showAlert(
      newValue ? '🔊 Sound effects enabled' : '🔇 Sound effects disabled',
      'success'
    );
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Please fill in all password fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showAlert('Password must be at least 6 characters', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiFetch('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      showAlert('Password updated successfully! 🎉', 'success');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showAlert(error.message || 'Failed to update password. Please check your current password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPin) {
      showAlert('Please enter your current PIN', 'error');
      return;
    }

    if (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin)) {
      showAlert('Current PIN must be 4 digits', 'error');
      return;
    }

    if (!newPin || !confirmPin) {
      showAlert('Please enter and confirm your new PIN', 'error');
      return;
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      showAlert('New PIN must be exactly 4 digits', 'error');
      return;
    }

    if (newPin !== confirmPin) {
      showAlert('New PINs do not match', 'error');
      return;
    }

    if (currentPin === newPin) {
      showAlert('New PIN must be different from current PIN', 'error');
      return;
    }

    setIsChangingPin(true);
    try {
      await apiFetch(`/users/${userId}/reset-transfer-pin`, {
        method: 'POST',
        body: JSON.stringify({ currentPin, newPin }),
      });

      showAlert('✅ Transfer PIN updated successfully!', 'success');
      setShowPinChangeModal(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (error: any) {
      showAlert(error.message || 'Failed to reset PIN. Please check your current PIN.', 'error');
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const response = await apiFetch('/otp/send-transfer-pin-reset', {
        method: 'POST',
        body: JSON.stringify({ userIdentifier: username }),
      });

      setOtpSent(true);
      setMaskedEmail(response.email || '');
      showAlert(`✅ OTP has been sent to your registered email!`, 'success');
    } catch (error: any) {
      showAlert(error.message || 'Failed to send OTP', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpAndResetPin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      showAlert('Please enter the 6-digit OTP', 'error');
      return;
    }

    if (!otpNewPin || !otpConfirmPin) {
      showAlert('Please enter and confirm your new PIN', 'error');
      return;
    }

    if (otpNewPin.length !== 4 || !/^\d{4}$/.test(otpNewPin)) {
      showAlert('New PIN must be exactly 4 digits', 'error');
      return;
    }

    if (otpNewPin !== otpConfirmPin) {
      showAlert('PINs do not match', 'error');
      return;
    }

    setVerifyingOtp(true);
    try {
      await apiFetch('/otp/verify-and-reset-pin', {
        method: 'POST',
        body: JSON.stringify({
          userIdentifier: username,
          otp,
          newPin: otpNewPin,
        }),
      });

      showAlert('✅ Transfer PIN reset successfully!', 'success');
      setShowForgotPinModal(false);
      setOtpSent(false);
      setOtp('');
      setOtpNewPin('');
      setOtpConfirmPin('');
      setMaskedEmail('');
    } catch (error: any) {
      showAlert(error.message || 'Failed to verify OTP and reset PIN', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setSendingOtp(true);
    try {
      await apiFetch('/otp/resend-transfer-pin-reset', {
        method: 'POST',
        body: JSON.stringify({ userIdentifier: username }),
      });

      showAlert('✅ New OTP has been sent!', 'success');
    } catch (error: any) {
      showAlert(error.message || 'Failed to resend OTP', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-content">
        
        {/* Account Security Section */}
        <div className="settings-section">
          <h2 className="section-title">🔐 Account Security</h2>
          
          <div className="security-card">
            <div className="security-option">
              <div className="option-info">
                <h3>🔒 Change Password</h3>
                <p>Update your account password</p>
              </div>
              <button 
                className="action-btn"
                onClick={() => setShowPasswordForm(true)}
              >
                Change
              </button>
            </div>

            <div className="security-option">
              <div className="option-info">
                <h3>🔑 Forgot Login Password</h3>
                <p>Can't remember your password? Request a reset</p>
              </div>
              <button 
                className="action-btn"
                onClick={() => setShowForgotPasswordModal(true)}
              >
                Request Reset
              </button>
            </div>

            <div className="security-option">
              <div className="option-info">
                <h3>💳 Change Token Transfer PIN</h3>
                <p>Reset your 4-digit token transfer PIN</p>
              </div>
              <button 
                className="action-btn"
                onClick={() => setShowPinChangeModal(true)}
              >
                Change PIN
              </button>
            </div>

            <div className="security-option">
              <div className="option-info">
                <h3>🔐 Forgot Transfer PIN</h3>
                <p>Can't remember your transfer PIN? Request a reset</p>
              </div>
              <button 
                className="action-btn"
                onClick={() => setShowForgotPinModal(true)}
              >
                Request Reset
              </button>
            </div>
          </div>
        </div>

        {/* Audio Settings Section */}
        <div className="settings-section">
          <h2 className="section-title">🔊 Audio Settings</h2>
          
          <div className="settings-option">
            <div className="option-info">
              <h3>🎵 Background Music</h3>
              <p>Toggle background music on/off</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={backgroundMusicEnabled}
                onChange={handleMusicToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="settings-option">
            <div className="option-info">
              <h3>🔊 Sound Effects</h3>
              <p>Toggle button clicks and game sounds</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={soundEffectsEnabled}
                onChange={handleSoundToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="modal-overlay" onClick={() => setShowPasswordForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔒 Change Password</h3>
              <button className="btn-close" onClick={() => setShowPasswordForm(false)}>✕</button>
            </div>
            
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowPasswordForm(false)}
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowForgotPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔐 Forgot Password</h3>
              <button className="btn-close" onClick={() => setShowForgotPasswordModal(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <p className="forgot-password-info">
                Submit a password reset request. Your request will appear in the admin panel where an administrator will review and reset your password.
              </p>

              <div className="user-info-box">
                <p><strong>Username:</strong> {username}</p>
                <p><strong>User ID:</strong> {userId}</p>
              </div>

              <p className="forgot-password-note">
                📄 Your request will be visible in the Admin Password Reset panel.
              </p>

              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowForgotPasswordModal(false)}
                  disabled={forgotPasswordLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn-submit"
                  onClick={async () => {
                    setForgotPasswordLoading(true);
                    try {
                      await apiFetch('/password-reset/request', {
                        method: 'POST',
                        body: JSON.stringify({ 
                          userIdentifier: username,
                          requestType: 'login'
                        })
                      });

                      showAlert('Password reset request submitted successfully! Admin will review your request.', 'success');
                      setShowForgotPasswordModal(false);
                    } catch (error: any) {
                      showAlert(error.message || 'Failed to submit request', 'error');
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

      {/* Change Transfer PIN Modal */}
      {showPinChangeModal && (
        <div className="modal-overlay" onClick={() => setShowPinChangeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💳 Change Transfer PIN</h3>
              <button className="btn-close" onClick={() => setShowPinChangeModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handlePinChange}>
              <div className="modal-body">
                <p className="forgot-password-info">
                  Change your 4-digit transfer PIN. Enter your current PIN and choose a new one.
                </p>

                <div className="form-group">
                  <label htmlFor="currentPin">Current Transfer PIN</label>
                  <input
                    type="password"
                    id="currentPin"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Enter your current 4-digit PIN"
                    maxLength={4}
                    pattern="\d{4}"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPin">New Transfer PIN</label>
                  <input
                    type="password"
                    id="newPin"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter new 4-digit PIN"
                    maxLength={4}
                    pattern="\d{4}"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPin">Confirm New PIN</label>
                  <input
                    type="password"
                    id="confirmPin"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Re-enter new 4-digit PIN"
                    maxLength={4}
                    pattern="\d{4}"
                    required
                  />
                </div>

                <p className="forgot-password-note">
                  ⚠️ Please remember your new PIN. You'll need it for token transfers!
                </p>
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowPinChangeModal(false);
                    setCurrentPin('');
                    setNewPin('');
                    setConfirmPin('');
                  }}
                  disabled={isChangingPin}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-submit"
                  disabled={isChangingPin}
                >
                  {isChangingPin ? 'Updating...' : 'Update PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Transfer PIN Modal with OTP */}
      {showForgotPinModal && (
        <div className="modal-overlay" onClick={() => {
          if (!sendingOtp && !verifyingOtp) {
            setShowForgotPinModal(false);
            setOtpSent(false);
            setOtp('');
            setOtpNewPin('');
            setOtpConfirmPin('');
            setMaskedEmail('');
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔐 Forgot Transfer PIN - OTP Verification</h3>
              <button 
                className="btn-close" 
                onClick={() => {
                  if (!sendingOtp && !verifyingOtp) {
                    setShowForgotPinModal(false);
                    setOtpSent(false);
                    setOtp('');
                    setOtpNewPin('');
                    setOtpConfirmPin('');
                    setMaskedEmail('');
                  }
                }}
                disabled={sendingOtp || verifyingOtp}
              >✕</button>
            </div>
            
            {!otpSent ? (
              <div className="modal-body">
                <p className="forgot-password-info">
                  📧 We'll send a 6-digit OTP to your registered email address. Enter the OTP to verify your identity and reset your transfer PIN.
                </p>

                <div className="user-info-box">
                  <p><strong>Username:</strong> {username}</p>
                  <p><strong>User ID:</strong> {userId}</p>
                </div>

                <p className="forgot-password-note">
                  ⏱️ The OTP will be valid for 10 minutes.
                </p>

                <div className="modal-actions">
                  <button 
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowForgotPinModal(false)}
                    disabled={sendingOtp}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    className="btn-submit"
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                  >
                    {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtpAndResetPin}>
                <div className="modal-body">
                  <p className="forgot-password-info">
                    ✅ OTP has been sent to {maskedEmail}
                  </p>

                  <div className="form-group">
                    <label htmlFor="otp">Enter OTP</label>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="otpNewPin">New Transfer PIN</label>
                    <input
                      type="password"
                      id="otpNewPin"
                      value={otpNewPin}
                      onChange={(e) => setOtpNewPin(e.target.value)}
                      placeholder="Enter new 4-digit PIN"
                      maxLength={4}
                      pattern="\d{4}"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="otpConfirmPin">Confirm New PIN</label>
                    <input
                      type="password"
                      id="otpConfirmPin"
                      value={otpConfirmPin}
                      onChange={(e) => setOtpConfirmPin(e.target.value)}
                      placeholder="Re-enter new 4-digit PIN"
                      maxLength={4}
                      pattern="\d{4}"
                      required
                    />
                  </div>

                  <p className="forgot-password-note">
                    Didn't receive OTP? <button type="button" onClick={handleResendOtp} disabled={sendingOtp} style={{color: '#ffd700', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer'}}>Resend OTP</button>
                  </p>

                  <div className="modal-actions">
                    <button 
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setShowForgotPinModal(false);
                        setOtpSent(false);
                        setOtp('');
                        setOtpNewPin('');
                        setOtpConfirmPin('');
                        setMaskedEmail('');
                      }}
                      disabled={verifyingOtp}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn-submit"
                      disabled={verifyingOtp}
                    >
                      {verifyingOtp ? 'Verifying...' : 'Verify & Reset PIN'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

