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

function PlayerCard({ player, position, showTimer, timeLeft, isCurrentPlayer = false }: PlayerCardProps) {
  const getPositionClass = () => {
    return `player-position-${position}`;
  };

  return (
    <div className={`player-card ${getPositionClass()} ${player.folded ? 'folded' : ''} ${player.turn ? 'active-turn' : ''} ${player.waitingForNextRound ? 'waiting' : ''}`}>
      {/* Pack and Side Show Buttons (left side) - only for other players */}
      {!isCurrentPlayer && !player.folded && (
        <div className="player-action-buttons">
          <button className="action-btn pack-btn" title="Pack">
            <span className="btn-icon">🎁</span>
            <span className="btn-label">Pack</span>
          </button>
          <button className="action-btn sideshow-btn" title="Side Show">
            <span className="btn-icon">�️</span>
            <span className="btn-label">Side Show</span>
          </button>
        </div>
      )}

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

      {/* Round Profile Picture - below cards */}
      <div className="player-avatar-container">
        <div className="player-avatar">
          <div className="avatar-placeholder">�</div>
        </div>
        {!isCurrentPlayer && (
          <div className="player-action-badge">
            {player.cardSet && !player.cardSet.closed ? 'Chaal' : 'Blind'}
          </div>
        )}
      </div>

      {/* Player Name and Chips - below profile */}
      <div className="player-info">
        {/* Hide name for current player (first person view) */}
        {!isCurrentPlayer && (
          <h4 className="player-name">{player.playerInfo.userName}</h4>
        )}
        <div className="player-chips">
          <span className="coin-icon">🪙</span>
          <span className="chips-amount">{player.playerInfo.chips} CR</span>
        </div>
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
