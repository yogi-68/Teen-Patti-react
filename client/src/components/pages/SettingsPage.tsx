import { useState } from 'react';
import './SettingsPage.css';
import { apiFetch, showAlert } from '../../utils/api';

interface SettingsPageProps {
  username: string;
  userId: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ userId, username }) => {
  // Enquiry form state
  const [enquirySubject, setEnquirySubject] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!enquirySubject.trim() || !enquiryMessage.trim()) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    setIsSubmittingEnquiry(true);
    
    try {
      await apiFetch('/enquiry/submit', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          username,
          subject: enquirySubject.trim(),
          message: enquiryMessage.trim(),
        }),
      });

      showAlert('Your enquiry has been submitted successfully! We will get back to you soon.', 'success');
      setEnquirySubject('');
      setEnquiryMessage('');
    } catch (error: any) {
      showAlert(error.message || 'Failed to submit enquiry. Please try again.', 'error');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-content">
        
        {/* Help & Support Section */}
        <div className="settings-section">
          <h2 className="section-title">📞 Help & Support</h2>
          
          <div className="enquiry-form-card">
            <h3 className="card-title">💬 Contact Us</h3>
            <p className="card-description">
              Have a question or need assistance? Send us a message and we'll get back to you as soon as possible.
            </p>
            
            <form onSubmit={handleEnquirySubmit} className="enquiry-form">
              <div className="form-group">
                <label htmlFor="enquirySubject">Subject</label>
                <select
                  id="enquirySubject"
                  value={enquirySubject}
                  onChange={(e) => setEnquirySubject(e.target.value)}
                  disabled={isSubmittingEnquiry}
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="account">Account Issues</option>
                  <option value="payment">Payment & Transactions</option>
                  <option value="game">Game Related</option>
                  <option value="subscription">Subscription</option>
                  <option value="technical">Technical Support</option>
                  <option value="feedback">Feedback & Suggestions</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="enquiryMessage">Message</label>
                <textarea
                  id="enquiryMessage"
                  value={enquiryMessage}
                  onChange={(e) => setEnquiryMessage(e.target.value)}
                  placeholder="Please describe your issue or question in detail..."
                  rows={6}
                  disabled={isSubmittingEnquiry}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-submit"
                disabled={isSubmittingEnquiry}
              >
                {isSubmittingEnquiry ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* Admin Contact Details Section */}
        <div className="settings-section">
          <h2 className="section-title">👨‍💼 Admin Contact Details</h2>
          
          <div className="admin-contact-card">
            <div className="contact-info-grid">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <div className="contact-label">Email Support</div>
                  <div className="contact-value">
                    <a href="mailto:support@teenpatti.com">support@teenpatti.com</a>
                  </div>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">📱</div>
                <div className="contact-details">
                  <div className="contact-label">WhatsApp Support</div>
                  <div className="contact-value">
                    <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer">
                      +1 (234) 567-8900
                    </a>
                  </div>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">⚡</div>
                <div className="contact-details">
                  <div className="contact-label">Response Time</div>
                  <div className="contact-value">
                    Usually within 2-4 hours<br />
                    <span className="highlight">Premium members: Priority support</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-note">
              <div className="note-icon">ℹ️</div>
              <div className="note-content">
                <strong>Important:</strong> For urgent issues related to transactions or account security, 
                please contact us immediately via WhatsApp or email. Premium members receive priority support 
                with faster response times.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
