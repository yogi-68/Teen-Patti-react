import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './store/gameStore';
import Lobby from './components/Lobby.tsx';
import GameTable from './components/GameTable.tsx';
import GameMenu from './components/GameMenu.tsx';
import './App.css';

type Screen = 'menu' | 'lobby' | 'game';

function App() {
  const socket = useSocket();
  const { tableState, myPlayerId, connected } = useGameStore();
  const [currentScreen, setCurrentScreen] = useState<Screen>('lobby');

  useEffect(() => {
    // Switch to game screen as soon as player joins (even if alone)
    console.log('📱 App: tableState =', tableState, 'myPlayerId =', myPlayerId);
    if (tableState && myPlayerId) {
      console.log('🎮 App: Switching to game screen');
      setCurrentScreen('game');
    }
  }, [tableState, myPlayerId]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 Teen Patti</h1>
        <div className="connection-status">
          {connected ? (
            <span className="status-connected">● Connected</span>
          ) : (
            <span className="status-disconnected">● Disconnected</span>
          )}
        </div>
      </header>

      <main className="app-main">
        {currentScreen === 'menu' && (
          <GameMenu onPlayTable={() => setCurrentScreen('lobby')} />
        )}
        {currentScreen === 'lobby' && (
          <Lobby socket={socket} />
        )}
        {currentScreen === 'game' && (
          <GameTable socket={socket} />
        )}
      </main>

      <footer className="app-footer">
        <p>Built with React + TypeScript + Socket.IO</p>
      </footer>
    </div>
  );
}

export default App;
