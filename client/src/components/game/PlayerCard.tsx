import { memo } from 'react';
import type { Player } from '../../types/game.types';
import PlayingCard from './PlayingCard.tsx';
import Timer from './Timer.tsx';
import './PlayerCard.css';

interface PlayerCardProps {
  player: Player;
  position: number;
  showTimer: boolean;
  timeLeft: number;
  isCurrentPlayer?: boolean; // Whether this is the viewing player
  currencySymbol: string;
  isJokerUser?: boolean; // Whether this player activated Joker (unused - kept for backward compatibility)
  viewerHasJoker?: boolean; // Whether the viewing player has activated Joker (can see all cards)
}

const PlayerCard = memo(({ player, showTimer, timeLeft, isCurrentPlayer = false, currencySymbol, viewerHasJoker = false }: PlayerCardProps) => {
  // Determine if we should show the card area (always show if player has cards)
  // For current player: Always show card area
  // For other players: Always show card backs (viewer doesn't see their actual cards unless they have Joker)
  const shouldShowCardArea = player.cardSet && player.cardSet.cards && player.cardSet.cards.length > 0;
  
  // Determine if cards should be revealed (face up)
  // For current player: Show if they've seen cards OR if they have Joker active
  // For other players: Only show face up if viewer has Joker
  const shouldRevealCards = isCurrentPlayer ? (!player.cardSet?.closed || viewerHasJoker) : viewerHasJoker;
  
  // Debug logging for Joker card visibility
  if (!isCurrentPlayer && player.cardSet?.cards) {
    const cards = player.cardSet.cards;
    const hasHiddenCards = cards.some((c: any) => c.type === 'hidden' || c.rank === 'hidden');
    
    if (viewerHasJoker || hasHiddenCards) {
      console.log(`🃏 PlayerCard for ${player.playerInfo.userName}:`, {
        viewerHasJoker,
        shouldRevealCards,
        hasHiddenCards,
        cardCount: cards.length,
        cards: cards.map((c: any) => `${c.rank}${c.type}`)
      });
    }
  }
  
  return (
    <div className={`player-card ${player.folded ? 'folded' : ''} ${player.turn ? 'active-turn' : ''} ${player.waitingForNextRound ? 'waiting' : ''}`}>
      {/* Cards Display - at top */}
      <div className="player-cards">
        {shouldShowCardArea && player.cardSet ? (
          <>
            {/* 
              hidden prop controls whether card shows face or back
              For current player: hidden = closed (true = back, false = face)
              For other players: hidden = !viewerHasJoker (always back unless viewer has Joker)
            */}
            <PlayingCard 
              card={player.cardSet.cards[0]} 
              hidden={!shouldRevealCards} 
              small 
            />
            <PlayingCard 
              card={player.cardSet.cards[1]} 
              hidden={!shouldRevealCards} 
              small 
            />
            <PlayingCard 
              card={player.cardSet.cards[2]} 
              hidden={!shouldRevealCards} 
              small 
            />
          </>
        ) : (
          <div className="no-cards-small">No cards</div>
        )}
      </div>

      {/* Player Name and Chips - below cards */}
      <div className="player-info">
        {/* Hide name for current player (first person view) */}
        {!isCurrentPlayer && (
          <h4 className="player-name">{player.playerInfo.userName}</h4>
        )}
        <div className="player-chips">
          <span className="coin-icon">{currencySymbol}</span>
          <span className="chips-amount">{player.playerInfo.chips.toLocaleString()}</span>
        </div>
        {/* Blind/Chaal Badge */}
        {!isCurrentPlayer && player.cardSet && (
          <div className="player-action-badge">
            {(player.isBlind ?? player.cardSet.closed) ? 'Blind' : 'Chaal'}
          </div>
        )}
      </div>

      {showTimer && (
        <Timer playerId={player.id} timeLeft={timeLeft} small />
      )}

      {player.folded && (
        <div className="folded-overlay">❌ FOLDED</div>
      )}
      
      {player.waitingForNextRound && (
        <span className="waiting-badge">⏳ Next Round</span>
      )}
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;
