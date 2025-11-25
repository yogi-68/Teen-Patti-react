import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import GameTable from '../game/GameTable';
import { useSocket } from '../../hooks/useSocket';
import './GamePage.css';

type GameMode = 'trial' | 'token';

const GamePage: React.FC = () => {
  const location = useLocation();
  const socket = useSocket();
  
  // Get game mode from location state or localStorage
  const [gameMode] = useState<GameMode>(() => {
    const state = location.state as { gameMode?: GameMode };
    const savedMode = localStorage.getItem('currentGameMode') as GameMode;
    return state?.gameMode || savedMode || 'trial';
  });

  // Save game mode to localStorage for persistence on refresh
  useEffect(() => {
    localStorage.setItem('currentGameMode', gameMode);
  }, [gameMode]);

  // Clear game mode on unmount (when leaving game)
  useEffect(() => {
    return () => {
      localStorage.removeItem('currentGameMode');
    };
  }, []);

  return (
    <div className="game-page">
      <GameTable socket={socket} gameMode={gameMode} />
    </div>
  );
};

export default GamePage;
