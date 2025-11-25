import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import SoundManager from '../../utils/SoundManager';
import './GoodCardsPopup.css';

interface GoodCardsPopupProps {
  socket: Socket | null;
  userId: string;
  tableId: number;
  gameMode: string;
  cards: any[];
}

const GOOD_CARD_TYPES: Record<string, string> = {
  trail: '🔥 Trail (Three of a Kind)',
  pure_sequence: '✨ Pure Sequence',
  sequence: '📈 Sequence',
  color: '🎨 Color (Flush)',
  pair: '👥 Pair',
};

function GoodCardsPopup({ socket, userId, tableId, gameMode, cards }: GoodCardsPopupProps) {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [cardQuality, setCardQuality] = useState<string>('');
  const [hasSeen, setHasSeen] = useState<boolean>(false);

  useEffect(() => {
    if (!socket || !cards || cards.length !== 3 || hasSeen) return;

    // Detect card quality from API
    fetch('/api/tips/detect-quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.shouldSuggestTip) {
          setCardQuality(data.cardQuality);
          setShowPopup(true);
          setHasSeen(true);
          SoundManager.playButtonClick();
        }
      })
      .catch((err) => console.error('Error detecting card quality:', err));
  }, [socket, cards, hasSeen]);

  const handleTip = (amount: number) => {
    if (!socket) return;

    socket.emit('player_tip', {
      tableId,
      playerId: userId,
      amount,
      gameMode,
      cardQuality,
    });

    setShowPopup(false);
    SoundManager.playButtonClick();
  };

  const handleClose = () => {
    setShowPopup(false);
    SoundManager.playButtonClick();
  };

  if (!showPopup) return null;

  return (
    <div className="good-cards-overlay" onClick={handleClose}>
      <div className="good-cards-popup" onClick={(e) => e.stopPropagation()}>
        <div className="good-cards-header">
          <h2>🎉 Great Cards!</h2>
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>
        
        <div className="good-cards-body">
          <div className="card-quality-badge">
            {GOOD_CARD_TYPES[cardQuality] || 'Good Hand'}
          </div>
          
          <p className="tip-suggestion">
            Celebrate your lucky draw! Send a tip to spread the joy! 🎊
          </p>
          
          <div className="tip-options-grid">
            <button className="tip-option tip-10" onClick={() => handleTip(10)}>
              💰 Tip 10
            </button>
            <button className="tip-option tip-20" onClick={() => handleTip(20)}>
              💰 Tip 20
            </button>
            <button className="tip-option tip-50" onClick={() => handleTip(50)}>
              💰 Tip 50
            </button>
            <button className="tip-option tip-100" onClick={() => handleTip(100)}>
              💰 Tip 100
            </button>
          </div>
          
          <button className="maybe-later-btn" onClick={handleClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoodCardsPopup;
