import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

interface LobbyProps {
  socket: Socket | null;
}

function Lobby({ socket }: LobbyProps) {
  const [userName, setUserName] = useState('');
  const [chips, setChips] = useState(1000);
  const [joining, setJoining] = useState(false);
  const { setMyPlayerId } = useGameStore();

  const handleJoinTable = () => {
    if (!socket || !userName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (joining) {
      return; // Prevent multiple clicks
    }

    setJoining(true);

    const playerInfo = {
      userName: userName.trim(),
      chips: chips,
    };

    let timeoutId: number | null = null;
    let hasResponded = false;

    // Set up the listener BEFORE emitting the request
    const handleJoinResponse = (response: { success: boolean; playerId?: string; message?: string }) => {
      if (hasResponded) return; // Prevent duplicate responses
      hasResponded = true;
      
      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      setJoining(false);
      if (response.success && response.playerId) {
        setMyPlayerId(response.playerId);
        console.log('✅ Joined table successfully!', response.playerId);
      } else {
        alert(response.message || 'Failed to join table');
      }
      // Clean up the listener
      socket.off('joinedTable', handleJoinResponse);
    };

    // Attach listener first
    socket.on('joinedTable', handleJoinResponse);

    // Then emit the request
    socket.emit('joinTable', { tableId: 1, playerInfo });

    // Timeout fallback in case no response
    timeoutId = setTimeout(() => {
      if (!hasResponded) {
        hasResponded = true;
        setJoining(false);
        socket.off('joinedTable', handleJoinResponse);
        alert('Connection timeout. Please try again.');
      }
    }, 5000);
  };

  return (
    <div className="lobby">
      <div className="lobby-card">
        <h2>Join Game</h2>
        <p className="lobby-description">
          Enter your details to join the Teen Patti table
        </p>

        <div className="form-group">
          <label htmlFor="userName">Player Name</label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            disabled={joining}
          />
        </div>

        <div className="form-group">
          <label htmlFor="chips">Starting Chips</label>
          <input
            id="chips"
            type="number"
            value={chips}
            onChange={(e) => setChips(Number(e.target.value))}
            min={100}
            max={10000}
            step={100}
            disabled={joining}
          />
          <small>Min: 100, Max: 10,000</small>
        </div>

        <button
          className="btn-primary"
          onClick={handleJoinTable}
          disabled={joining || !userName.trim()}
        >
          {joining ? 'Joining...' : 'Join Table'}
        </button>

        <div className="game-info">
          <h3>Game Rules</h3>
          <ul>
            <li>🎲 Boot Amount: 2 chips</li>
            <li>👥 2-6 players per table</li>
            <li>⏱️ 20 seconds per turn</li>
            <li>🃏 3 cards dealt to each player</li>
            <li>🏆 Winner takes the pot</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
