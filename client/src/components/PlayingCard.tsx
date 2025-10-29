import type { Card } from '../types/game.types';
import './PlayingCard.css';

interface PlayingCardProps {
  card: Card;
  hidden?: boolean;
  small?: boolean;
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

  if (hidden) {
    return (
      <div className={`playing-card card-back ${small ? 'card-small' : ''}`}>
        <div className="card-pattern">🎴</div>
      </div>
    );
  }

  return (
    <div className={`playing-card ${small ? 'card-small' : ''} card-${getSuitColor(card.type)}`}>
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
