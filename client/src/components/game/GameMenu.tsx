import { useState } from 'react';
import './GameMenu.css';

interface GameMenuProps {
  onPlayTable: () => void;
}

function GameMenu({ onPlayTable }: GameMenuProps) {
  const [userName] = useState(localStorage.getItem('userName') || 'Guest');
  const [chips] = useState(1000);

  const handleViewLobby = () => {
    // Navigate back to lobby
    window.location.reload();
  };

  return (
    <div className="game-menu-container">
      <div className="logo-container">
        <div className="logo">🎮</div>
        <h1 className="game-title">Teen Patti</h1>
      </div>

      <div className="menu-panel">
        <div className="panel-header">
          <span className="user-icon">👤</span>
          <span className="welcome-text">Welcome, {userName}</span>
        </div>

        <div className="panel-body">
          <div className="player-info">
            <span className="chips-icon">🪙</span>
            <span className="chips-amount">${chips.toLocaleString()}</span>
          </div>

          <div className="menu-buttons">
            <button 
              className="menu-btn play-lobby"
              onClick={handleViewLobby}
            >
              <span className="btn-icon">📋</span>
              <span className="btn-text">View Lobby</span>
            </button>

            <button 
              className="menu-btn play-tournament"
              disabled
              title="Coming Soon"
            >
              <span className="btn-icon">🏆</span>
              <span className="btn-text">Play Tournament</span>
              <span className="coming-soon">Coming Soon</span>
            </button>

            <button 
              className="menu-btn play-table"
              onClick={onPlayTable}
              disabled={chips < 2}
            >
              <span className="btn-icon">🎲</span>
              <span className="btn-text">Play Table</span>
            </button>

            <button 
              className="menu-btn play-private"
              disabled
              title="Coming Soon"
            >
              <span className="btn-icon">🔒</span>
              <span className="btn-text">Play Private</span>
              <span className="coming-soon">Coming Soon</span>
            </button>
          </div>

          <div className="menu-footer">
            <p>Minimum 2 chips required to play</p>
            <p>Boot amount: $2</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameMenu;
