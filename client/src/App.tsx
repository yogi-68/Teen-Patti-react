import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameStore } from './store/gameStore';
import Lobby from './components/Lobby.tsx';
import Dashboard from './components/Dashboard.tsx';
import './App.css';

type Screen = 'lobby' | 'dashboard';

function App() {
  const socket = useSocket();
  const { connected } = useGameStore();
  const [currentScreen, setCurrentScreen] = useState<Screen>('lobby');
  const [username, setUsername] = useState('');
  const [userCoins, setUserCoins] = useState(10000);

  const handleLogin = (name: string, chips: number) => {
    setUsername(name);
    setUserCoins(chips);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setUsername('');
    setCurrentScreen('lobby');
  };

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
        {currentScreen === 'lobby' && (
          <Lobby socket={socket} onJoin={handleLogin} />
        )}
        {currentScreen === 'dashboard' && (
          <Dashboard 
            username={username} 
            coins={userCoins}
            onLogout={handleLogout}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Built with React + TypeScript + Socket.IO</p>
      </footer>
    </div>
  );
}

export default App;
