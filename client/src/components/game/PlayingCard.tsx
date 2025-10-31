import type { Card } from '../../types/game.types';
import './PlayingCard.css';

interface PlayingCardProps {
  card: Card;
  hidden?: boolean;
  small?: boolean;
  index?: number;
}

function PlayingCard({ card, hidden = false, small = false }: PlayingCardProps) {
  const getSuitSymbol = (type: string) => {
    switch (type) {
      case 'heart':
        return '♥';
      case 'diamond':
        return '♦';
      case 'club':
        return '♣';
      case 'spade':
        return '♠';
      default:
        return '';
    }
  };

  const getSuitColor = (type: string) => {
    return type === 'heart' || type === 'diamond' ? 'red' : 'black';
  };

  // Check if card is a placeholder/hidden card from server
  const isPlaceholderCard = card.type === ('hidden' as any) || !card.type || !card.name;

  // If explicitly marked as hidden (blind cards) or placeholder, show card back with same structure
  if (hidden || isPlaceholderCard) {
    if (isPlaceholderCard && !hidden) {
      console.warn('⚠️ Placeholder card detected when not hidden - store preservation may have failed');
    }
    return (
      <div 
        className={`playing-card ${small ? 'card-small' : ''} card-back-full`}
      >
        <span className="card-back-icon">🎴</span>
      </div>
    );
  }

  // Show real card
  return (
    <div 
      className={`playing-card ${small ? 'card-small' : ''} card-${getSuitColor(card.type)}`}
    >
      <div className="card-content">
        <div className="card-rank">{card.name}</div>
        <div className="card-suit">{getSuitSymbol(card.type)}</div>
      </div>
      <div className="card-center">
        <span className="card-suit-large">{getSuitSymbol(card.type)}</span>
      </div>
    </div>
  );
}

export default PlayingCard;
