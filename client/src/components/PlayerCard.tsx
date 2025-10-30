import type { Player } from '../types/game.types';
import PlayingCard from './PlayingCard.tsx';
import Timer from './Timer.tsx';
import './PlayerCard.css';

interface PlayerCardProps {
  player: Player;
  position: number;
  showTimer: boolean;
  timeLeft: number;
  isCurrentPlayer?: boolean; // Whether this is the viewing player
}

function PlayerCard({ player, showTimer, timeLeft, isCurrentPlayer = false }: PlayerCardProps) {
  return (
    <div className={`player-card ${player.folded ? 'folded' : ''} ${player.turn ? 'active-turn' : ''} ${player.waitingForNextRound ? 'waiting' : ''}`}>
      {/* Cards Display - at top */}
      <div className="player-cards">
        {player.cardSet && player.cardSet.cards.length > 0 ? (
          <>
            {/* 
              For current player: Show cards if seen (!closed), hide if blind (closed)
              For other players: Always hide cards
            */}
            <PlayingCard 
              card={player.cardSet.cards[0]} 
              hidden={isCurrentPlayer ? player.cardSet.closed : true} 
              small 
            />
            <PlayingCard 
              card={player.cardSet.cards[1]} 
              hidden={isCurrentPlayer ? player.cardSet.closed : true} 
              small 
            />
            <PlayingCard 
              card={player.cardSet.cards[2]} 
              hidden={isCurrentPlayer ? player.cardSet.closed : true} 
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
          <span className="coin-icon">🪙</span>
          <span className="chips-amount">{player.playerInfo.chips} CR</span>
        </div>
        {/* Blind/Chaal Badge */}
        {!isCurrentPlayer && (
          <div className="player-action-badge">
            {player.cardSet && !player.cardSet.closed ? 'Chaal' : 'Blind'}
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
