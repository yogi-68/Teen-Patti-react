import { useState } from 'react';
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import './App.css';

type Screen = 'auth' | 'dashboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [username, setUsername] = useState('');
  const [userCoins, setUserCoins] = useState(100);
  const [userId, setUserId] = useState('');
  const [cashBalance, setCashBalance] = useState(0);

  const handleLogin = (name: string, coins: number, id: string, cash: number) => {
    setUsername(name);
    setUserCoins(coins);
    setUserId(id);
    setCashBalance(cash);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setUsername('');
    setUserId('');
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
          userId={userId}
          initialCashBalance={cashBalance}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
