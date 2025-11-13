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
  isJokerUser?: boolean; // Whether this player activated Joker
  viewerHasJoker?: boolean; // Whether the viewing player has activated Joker (can see all cards)
}

function PlayerCard({ player, showTimer, timeLeft, isCurrentPlayer = false, currencySymbol, isJokerUser = false, viewerHasJoker = false }: PlayerCardProps) {
  // Determine if cards should be shown for this player
  // For current player: Always show their card area (hidden or revealed based on closed state)
  // For other players when viewer has Joker: Only show if they've clicked "See Cards" (closed === false)
  // For other players without Joker: Show based on their closed state
  const shouldShowCards = isCurrentPlayer || !viewerHasJoker || (viewerHasJoker && !player.cardSet?.closed);
  
  return (
    <div className={`player-card ${player.folded ? 'folded' : ''} ${player.turn ? 'active-turn' : ''} ${player.waitingForNextRound ? 'waiting' : ''} ${isJokerUser ? 'joker-user' : ''}`}>
      {/* Cards Display - at top */}
      <div className={`player-cards ${isJokerUser ? 'joker-cards' : ''}`}>
        {shouldShowCards && player.cardSet && player.cardSet.cards.length > 0 ? (
          <>
            {/* 
              For current player: Show cards if seen (!closed), hide if blind (closed)
              For other players with Joker viewer: Cards are visible (they've seen them)
              For other players without Joker: Show card backs (normal behavior)
            */}
            <PlayingCard 
              card={player.cardSet.cards[0]} 
              hidden={isCurrentPlayer ? player.cardSet.closed : (!viewerHasJoker && (player.cardSet.closed ?? true))} 
              small 
            />
            <PlayingCard 
              card={player.cardSet.cards[1]} 
              hidden={isCurrentPlayer ? player.cardSet.closed : (!viewerHasJoker && (player.cardSet.closed ?? true))} 
              small 
            />
            <PlayingCard 
              card={player.cardSet.cards[2]} 
              hidden={isCurrentPlayer ? player.cardSet.closed : (!viewerHasJoker && (player.cardSet.closed ?? true))} 
              small 
            />
          </>
        ) : !shouldShowCards ? (
          <div className="no-cards-small">🔒 Blind</div>
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
            {player.cardSet.closed ? 'Blind' : 'Chaal'}
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
}

export default PlayerCard;
