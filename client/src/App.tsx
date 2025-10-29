import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './store/gameStore';
import Lobby from './components/Lobby.tsx';
import GameTable from './components/GameTable.tsx';
import './App.css';

function App() {
  const socket = useSocket();
  const { tableState, myPlayerId, connected } = useGameStore();
  const [inGame, setInGame] = useState(false);

  useEffect(() => {
    if (tableState && myPlayerId) {
      setInGame(true);
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
        {!inGame ? (
          <Lobby socket={socket} />
        ) : (
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
