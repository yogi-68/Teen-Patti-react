import React, { useState, useEffect } from 'react';
import './JokerButton.css';

interface JokerRequirements {
  meetsRequirements: boolean;
  hasMadeDeposit: boolean;
  currentBalance: number;
  needsBalance: number;
}

interface JokerButtonProps {
  userId: string;
  tableType: 'demo' | 'cash';
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/joker/requirements`, {
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
      return '✅ Joker activated! You can see other Joker users\' cards.';
    }

    if (tableType === 'demo') {
      return '❌ Joker not available in demo tables. Join a cash table!';
    }

    if (!requirements) {
      return 'Loading...';
    }

    if (!requirements.hasMadeDeposit) {
      return '❌ Make your first deposit to unlock Joker!';
    }

    if (requirements.currentBalance < 500) {
      return `❌ Need ${requirements.needsBalance} more coins (minimum 500 required)`;
    }

    return '🃏 Click to activate Joker!\n\n✨ Benefits:\n• See other Joker users\' cards\n• Compete in mini-competition\n\n⚠️ Fee:\n• 30% if you win as top Joker\n• No fee if you don\'t win';
  };

  const handleClick = () => {
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
                <span className="stat-value">{requirements.currentBalance} coins</span>
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
