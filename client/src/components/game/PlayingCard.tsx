import type { Card } from '../../types/game.types';
import './PlayingCard.css';

interface PlayingCardProps {
  card: Card;
  hidden?: boolean;
  small?: boolean;
  index?: number;
}

function PlayingCard({ card, hidden = false, small = false }: PlayingCardProps) {
  // Map card data to SVG filename
  const getCardImagePath = (card: Card): string => {
    const rankMap: { [key: string]: string } = {
      'A': 'ace',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '6': '6',
      '7': '7',
      '8': '8',
      '9': '9',
      '10': '10',
      'J': 'jack',
      'Q': 'queen',
      'K': 'king',
    };

    const suitMap: { [key: string]: string } = {
      'heart': 'hearts',
      'diamond': 'diamonds',
      'club': 'clubs',
      'spade': 'spades',
    };

    const rank = rankMap[card.name] || card.name.toLowerCase();
    const suit = suitMap[card.type] || card.type.toLowerCase();

    return `/images/cards/${rank}_of_${suit}.svg`;
  };

  // Check if card is a placeholder/hidden card from server
  const isPlaceholderCard = card.type === ('hidden' as any) || !card.type || !card.name;

  // If explicitly marked as hidden (blind cards) or placeholder, show card back
  // Placeholder cards are expected when viewing other players' cards without Joker
  if (hidden || isPlaceholderCard) {
    return (
      <div className={`playing-card playing-card-back ${small ? 'card-small' : ''}`}>
        <img 
          src="/images/cards/red_joker.svg" 
          alt="Card back"
          className="card-image"
        />
      </div>
    );
  }

  // Show real card with SVG image
  return (
    <div className={`playing-card ${small ? 'card-small' : ''}`}>
      <img 
        src={getCardImagePath(card)} 
        alt={`${card.name} of ${card.type}s`}
        className="card-image"
      />
    </div>
  );
}

export default PlayingCard;
