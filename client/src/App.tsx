import { useState } from 'react';
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import './App.css';

type Screen = 'auth' | 'dashboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [username, setUsername] = useState('');
  const [userCoins, setUserCoins] = useState(10000);

  const handleLogin = (name: string, chips: number) => {
    setUsername(name);
    setUserCoins(chips);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setUsername('');
    setCurrentScreen('auth');
  };

  return (
    <div className="app">
      {currentScreen === 'auth' && (
        <Auth onLogin={handleLogin} />
      )}
      {currentScreen === 'dashboard' && (
        <Dashboard 
          username={username} 
          coins={userCoins}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
