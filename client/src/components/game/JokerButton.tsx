import React, { useState, useEffect } from 'react';
import SoundManager from '../../utils/SoundManager';
import './JokerButton.css';

interface JokerRequirements {
  meetsRequirements: boolean;
  hasMadeDeposit: boolean;
  currentBalance: number;
  needsBalance: number;
}

interface JokerButtonProps {
  userId: string;
  tableType: 'demo' | 'token';
  hasActivated: boolean;
  onActivate: () => void;
  disabled?: boolean;
}

export const JokerButton: React.FC<JokerButtonProps> = ({
  userId,
  tableType,
  hasActivated,
  onActivate,
  disabled = false
}) => {
  const [requirements, setRequirements] = useState<JokerRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetchRequirements();
  }, [userId]);

  const fetchRequirements = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/joker/requirements`, {
        headers: {
          'x-user-id': userId
        }
      });

      const data = await response.json();
      if (data.success) {
        setRequirements(data.data);
      }
    } catch (error) {
      console.error('Error fetching Joker requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const canActivate = (): boolean => {
    if (!requirements) return false;
    if (tableType === 'demo') return false;
    if (hasActivated) return false;
    if (disabled) return false;
    return requirements.meetsRequirements;
  };

  const getTooltipMessage = (): string => {
    if (hasActivated) {
      return '✅ Joker activated! You can see ALL players\' cards.';
    }

    if (tableType === 'demo') {
      return '❌ Joker not available in demo tables. Join a token table!';
    }

    if (!requirements) {
      return 'Loading...';
    }

    if (!requirements.hasMadeDeposit) {
      return '❌ Make your first deposit to unlock Joker!';
    }

    if (requirements.currentBalance < 500) {
      return `❌ Need ${requirements.needsBalance} more trial (minimum 500 required)`;
    }

    return '🃏 Click to activate Joker!\n\n✨ Benefits:\n• See ALL players\' cards for entire game\n• Your cards get gold background\n\n⚠️ Fee:\n• 30% if you win AND are top Joker\n• Only highest Joker winner pays fee\n• One use per game';
  };

  const handleClick = () => {
    SoundManager.playButtonClick();
    if (canActivate()) {
      onActivate();
    }
  };

  if (loading) {
    return (
      <button className="joker-button joker-button-loading" disabled>
        <span className="joker-icon">🃏</span>
        <span className="joker-text">Loading...</span>
      </button>
    );
  }

  const isActive = canActivate();
  const buttonClass = `joker-button ${
    hasActivated
      ? 'joker-button-activated'
      : isActive
      ? 'joker-button-active'
      : 'joker-button-disabled'
  }`;

  return (
    <div
      className="joker-button-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        className={buttonClass}
        onClick={handleClick}
        disabled={!isActive || hasActivated}
      >
        <span className="joker-icon">🃏</span>
        <span className="joker-text">
          {hasActivated ? 'Activated' : 'Joker'}
        </span>
        {hasActivated && (
          <span className="joker-checkmark">✓</span>
        )}
      </button>

      {showTooltip && (
        <div className="joker-tooltip">
          <div className="joker-tooltip-content">
            {getTooltipMessage().split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < getTooltipMessage().split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
          
          {requirements && !hasActivated && requirements.meetsRequirements && (
            <div className="joker-tooltip-stats">
              <div className="stat">
                <span className="stat-label">Your Balance:</span>
                <span className="stat-value">{requirements.currentBalance} token</span>
              </div>
              <div className="stat">
                <span className="stat-label">Fee (if win):</span>
                <span className="stat-value">30%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {hasActivated && (
        <div className="joker-active-indicator">
          <div className="joker-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default JokerButton;
