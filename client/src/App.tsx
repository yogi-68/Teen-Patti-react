import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import Navigation from './components/Navigation.tsx';
import ProfilePage from './components/ProfilePage.tsx';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [userCoins, setUserCoins] = useState(100);
  const [userId, setUserId] = useState('');
  const [cashBalance, setCashBalance] = useState(0);

  const handleLogin = (name: string, coins: number, id: string, cash: number) => {
    setUsername(name);
    setUserCoins(coins);
    setUserId(id);
    setCashBalance(cash);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUsername('');
    setUserId('');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Navigation 
          username={username}
          coins={userCoins}
          cashBalance={cashBalance}
          onLogout={handleLogout}
        />
        
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                username={username} 
                coins={userCoins}
                userId={userId}
                initialCashBalance={cashBalance}
                onLogout={handleLogout}
              />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProfilePage 
                username={username}
                coins={userCoins}
                cashBalance={cashBalance}
                userId={userId}
              />
            } 
          />
          {/* Redirect any other route to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
