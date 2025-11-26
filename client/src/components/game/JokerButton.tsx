import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { TableState } from '../../types/game.types';
import SoundManager from '../../utils/SoundManager';
import './JokerButton.css';

interface JokerButtonProps {
  socket: Socket | null;
  tableState: TableState;
  userId: string;
  gameMode: string;
}

interface JokerEligibility {
  eligible: boolean;
  reason?: string;
  hasMadeFirstDeposit?: boolean;
  realToken?: number;
}

function JokerButton({ socket, tableState, userId, gameMode }: JokerButtonProps) {
  const [eligible, setEligible] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');
  const [hasUsed, setHasUsed] = useState<boolean>(false);
  const [assignedTier, setAssignedTier] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [jokerUsers, setJokerUsers] = useState<string[]>([]);

  // Check eligibility on mount and when game state changes
  useEffect(() => {
    if (!socket || !userId || gameMode === 'practice') return;

    const checkEligibility = () => {
      socket.emit('joker:check-eligibility', {
        tableId: tableState.id,
        userId,
        gameMode,
      });
    };

    checkEligibility();

    // Listen for eligibility result
    const handleEligibilityResult = (result: JokerEligibility) => {
      setEligible(result.eligible);
      setReason(result.reason || '');
    };

    socket.on('joker:eligibility-result', handleEligibilityResult);

    return () => {
      socket.off('joker:eligibility-result', handleEligibilityResult);
    };
  }, [socket, userId, tableState.id, gameMode]);

  // Listen for Joker status updates
  useEffect(() => {
    if (!socket) return;

    const handleJokerActivated = (data: any) => {
      setJokerUsers(data.jokerUsers || []);
      if (data.userId === userId) {
        setHasUsed(true);
        setAssignedTier(data.assignedTier);
      }
    };

    const handleUsageResult = (result: any) => {
      setLoading(false);
      if (result.success) {
        setHasUsed(true);
        setAssignedTier(result.assignedTier);
        SoundManager.playButtonClick();
      } else {
        // Show server-side validation error
        alert(result.error || 'Failed to activate Joker');
      }
    };

    const handleGameStarted = () => {
      // Reset Joker state for new game
      console.log('🎮 New game started - resetting Joker button state');
      setHasUsed(false);
      setAssignedTier(null);
      setJokerUsers([]);
    };

    socket.on('joker:activated', handleJokerActivated);
    socket.on('joker:usage-result', handleUsageResult);
    socket.on('joker:error', (data: any) => {
      setLoading(false);
      alert(data.error || 'Joker error');
    });
    socket.on('gameStarted', handleGameStarted);

    return () => {
      socket.off('joker:activated', handleJokerActivated);
      socket.off('joker:usage-result', handleUsageResult);
      socket.off('joker:error');
      socket.off('gameStarted', handleGameStarted);
    };
  }, [socket, userId]);

  const handleJokerClick = () => {
    SoundManager.playButtonClick();
    // All validation is done server-side, just send the request
    if (!socket) return;
    setLoading(true);
    socket.emit('joker:use', {
      tableId: tableState.id,
      userId,
      gameMode,
    });
  };

  // Don't show in practice mode
  if (gameMode === 'practice') return null;

  // Don't show if game not started
  if (tableState.gameState !== 'betting') return null;

  const getTierDisplay = () => {
    const tierNames: Record<number, string> = {
      5: '🃏 Tier 5 (Best)',
      4: '🃏 Tier 4',
      3: '🃏 Tier 3',
      2: '🃏 Tier 2',
      1: '🃏 Tier 1',
    };
    return assignedTier ? tierNames[assignedTier] : '';
  };

  return (
    <>
      <div className="joker-button-container">
        <button
          className={`joker-button ${hasUsed ? 'joker-used' : ''} ${!eligible ? 'joker-disabled' : ''}`}
          onClick={handleJokerClick}
          disabled={hasUsed || !eligible || loading}
          title={hasUsed ? 'Already used' : !eligible ? reason : 'Use Joker (30% fee)'}
        >
          {hasUsed ? (
            <span>
              🃏 Used
              {assignedTier && <span className="tier-badge">{getTierDisplay()}</span>}
            </span>
          ) : (
            <span>🃏 Use Joker</span>
          )}
        </button>

        {jokerUsers.length > 0 && (
          <div className="joker-status">
            <span className="joker-count">{jokerUsers.length} Joker user{jokerUsers.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>


    </>
  );
}

export default JokerButton;
