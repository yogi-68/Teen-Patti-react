import type { Player } from '../types/game.types';
import PlayingCard from './PlayingCard.tsx';
import Timer from './Timer.tsx';

interface PlayerCardProps {
  player: Player;
  position: number;
  showTimer: boolean;
  timeLeft: number;
}

function PlayerCard({ player, position, showTimer, timeLeft }: PlayerCardProps) {
  const getPositionClass = () => {
    return `player-position-${position}`;
  };

  return (
    <div className={`player-card ${getPositionClass()} ${player.folded ? 'folded' : ''} ${player.turn ? 'active-turn' : ''}`}>
      <div className="player-info">
        <h4>{player.playerInfo.userName}</h4>
        <p className="player-chips">💰 {player.playerInfo.chips}</p>
        {player.totalBet > 0 && (
          <p className="player-bet">Bet: {player.totalBet}</p>
        )}
        {player.folded && (
          <span className="folded-badge">Folded</span>
        )}
      </div>

      <div className="player-cards">
        {player.cardSet && player.cardSet.cards.length > 0 ? (
          <>
            <PlayingCard card={player.cardSet.cards[0]} hidden={true} small />
            <PlayingCard card={player.cardSet.cards[1]} hidden={true} small />
            <PlayingCard card={player.cardSet.cards[2]} hidden={true} small />
          </>
        ) : (
          <div className="no-cards-small">No cards</div>
        )}
      </div>

      {showTimer && (
        <Timer playerId={player.id} timeLeft={timeLeft} small />
      )}

      {player.cardSet && !player.cardSet.closed && (
        <div className="seen-badge">Seen</div>
      )}
    </div>
  );
}

export default PlayerCard;
