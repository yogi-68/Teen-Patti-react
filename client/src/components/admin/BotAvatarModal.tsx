import React, { useState } from 'react';
import AvatarUpload from './AvatarUpload';
import './BotAvatarModal.css';

interface BotAvatarModalProps {
  bot: {
    bot_instance_id: string;
    display_name: string;
    avatar_url?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onAvatarUpdated: () => void;
}

const BotAvatarModal: React.FC<BotAvatarModalProps> = ({
  bot,
  isOpen,
  onClose,
  onAvatarUpdated,
}) => {
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAvatarChange = () => {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onAvatarUpdated();
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Bot Avatar</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="bot-info">
            <h3>{bot.display_name}</h3>
            <p className="bot-id">ID: {bot.bot_instance_id}</p>
          </div>

          <AvatarUpload
            currentAvatar={bot.avatar_url}
            onAvatarChange={handleAvatarChange}
            entityType="bot"
            entityId={bot.bot_instance_id}
          />

          {success && (
            <div className="success-message">
              <span>✅</span>
              Avatar updated successfully!
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BotAvatarModal;
