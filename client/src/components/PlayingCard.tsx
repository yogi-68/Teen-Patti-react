import { motion } from 'framer-motion';
import type { Card } from '../types/game.types';
import './PlayingCard.css';

interface PlayingCardProps {
  card: Card;
  hidden?: boolean;
  small?: boolean;
  index?: number; // For staggered animations
}

function PlayingCard({ card, hidden = false, small = false, index = 0 }: PlayingCardProps) {
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

  // If explicitly marked as hidden (blind cards), show card back
  if (hidden) {
    return (
      <motion.div 
        className={`playing-card card-back ${small ? 'card-small' : ''}`}
        initial={{ rotateY: 90, opacity: 0, x: -100 }}
        animate={{ rotateY: 0, opacity: 1, x: 0 }}
        transition={{ 
          duration: 0.4,
          delay: index * 0.1,
          ease: "easeOut"
        }}
        whileHover={{ scale: 1.05, y: -5 }}
      >
        <div className="card-pattern">🎴</div>
      </motion.div>
    );
  }

  // If card is placeholder but not hidden, it means store should have preserved real cards
  // This shouldn't happen if store is working correctly, but show card back as fallback
  if (isPlaceholderCard) {
    console.warn('⚠️ Placeholder card detected when not hidden - store preservation may have failed');
    return (
      <motion.div 
        className={`playing-card card-back ${small ? 'card-small' : ''}`}
        initial={{ rotateY: 90, opacity: 0, x: -100 }}
        animate={{ rotateY: 0, opacity: 1, x: 0 }}
        transition={{ 
          duration: 0.4,
          delay: index * 0.1,
          ease: "easeOut"
        }}
      >
        <div className="card-pattern">🎴</div>
      </motion.div>
    );
  }

  // Show real card
  return (
    <motion.div 
      className={`playing-card ${small ? 'card-small' : ''} card-${getSuitColor(card.type)}`}
      initial={{ rotateY: 90, opacity: 0, x: -100 }}
      animate={{ rotateY: 0, opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ scale: 1.1, y: -10 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="card-content">
        <div className="card-rank">{card.name}</div>
        <div className="card-suit">{getSuitSymbol(card.type)}</div>
      </div>
      <div className="card-center">
        <span className="card-suit-large">{getSuitSymbol(card.type)}</span>
      </div>
    </motion.div>
  );
}

export default PlayingCard;
