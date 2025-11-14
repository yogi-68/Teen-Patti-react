import { useState, useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Navigation from './components/layout/Navigation.tsx';
import AppRoutes from './routes/AppRoutes.tsx';
import './App.css';

// Component to conditionally show navigation
function AppContent({ 
  username, 
  practiceCoins, 
  realCoins, 
  onLogout, 
  isAdmin,
  isAuthenticated,
  userCoins,
  cashBalance,
  isSubscribed,
  userId,
  hasSeenTour,
  onLogin
}: any) {
  const location = useLocation();
  
  // Hide navigation on login page and game pages
  const hideNavigation = location.pathname === '/login' || location.pathname.startsWith('/game/');

  return (
    <div className="app">
      {!hideNavigation && isAuthenticated && (
        <Navigation 
          username={username}
          coins={practiceCoins}
          cashBalance={realCoins}
          onLogout={onLogout}
          isAdmin={isAdmin}
        />
      )}
      
      <AppRoutes
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        username={username}
        userId={userId}
        practiceCoins={practiceCoins}
        realCoins={realCoins}
        userCoins={userCoins}
        cashBalance={cashBalance}
        isSubscribed={isSubscribed}
        hasSeenTour={hasSeenTour}
        onLogin={onLogin}
        onLogout={onLogout}
      />
    </div>
  );
}

function App() {
  // Initialize state from localStorage if available
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('userId') !== null;
  });
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [userCoins, setUserCoins] = useState(() => {
    const saved = localStorage.getItem('userCoins');
    return saved ? Number(saved) : 100;
  });
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');
  const [cashBalance, setCashBalance] = useState(() => {
    const saved = localStorage.getItem('cashBalance');
    return saved ? Number(saved) : 0;
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('isSubscribed') === 'true';
  });
  const [practiceCoins, setPracticeCoins] = useState(() => {
    const saved = localStorage.getItem('practiceCoins');
    return saved ? Number(saved) : 50;
  });
  const [realCoins, setRealCoins] = useState(() => {
    const saved = localStorage.getItem('realCoins');
    return saved ? Number(saved) : 0;
  });
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return localStorage.getItem('hasSeenTour') === 'true';
  });

  // Fetch fresh balance from server on mount and after refresh
  useEffect(() => {
    const fetchFreshBalance = async () => {
      if (!userId) return;
      
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/users/${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          const user = data.user;
          
          // Update both state and localStorage with fresh data
          const newPracticeCoins = user.practiceCoins || 50;
          const newRealCoins = user.realCoins || 0;
          const newIsSubscribed = user.isSubscribed || false;
          
          if (newPracticeCoins !== practiceCoins) {
            setPracticeCoins(newPracticeCoins);
            localStorage.setItem('practiceCoins', String(newPracticeCoins));
          }
          
          if (newRealCoins !== realCoins) {
            setRealCoins(newRealCoins);
            setCashBalance(newRealCoins);
            localStorage.setItem('realCoins', String(newRealCoins));
            localStorage.setItem('cashBalance', String(newRealCoins));
          }
          
          if (newIsSubscribed !== isSubscribed) {
            setIsSubscribed(newIsSubscribed);
            localStorage.setItem('isSubscribed', String(newIsSubscribed));
          }
        }
      } catch (error) {
        console.error('Error fetching fresh balance:', error);
      }
    };
    
    // Fetch immediately on mount
    fetchFreshBalance();
    
    // Also fetch on window focus (when user returns to tab)
    const handleFocus = () => {
      fetchFreshBalance();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId]); // Only depend on userId, not balance values

  // Listen for balance updates from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedPractice = localStorage.getItem('practiceCoins');
      const savedReal = localStorage.getItem('realCoins');
      const savedIsAdmin = localStorage.getItem('isAdmin');
      const savedIsSubscribed = localStorage.getItem('isSubscribed');
      
      if (savedPractice) {
        const newPracticeCoins = Number(savedPractice);
        if (newPracticeCoins !== practiceCoins) {
          setPracticeCoins(newPracticeCoins);
        }
      }
      
      if (savedReal) {
        const newRealCoins = Number(savedReal);
        if (newRealCoins !== realCoins) {
          setRealCoins(newRealCoins);
        }
      }
      
      // Sync isAdmin state with localStorage
      if (savedIsAdmin !== null) {
        const newIsAdmin = savedIsAdmin === 'true';
        if (newIsAdmin !== isAdmin) {
          setIsAdmin(newIsAdmin);
        }
      }
      
      // Sync isSubscribed state with localStorage
      if (savedIsSubscribed !== null) {
        const newIsSubscribed = savedIsSubscribed === 'true';
        if (newIsSubscribed !== isSubscribed) {
          setIsSubscribed(newIsSubscribed);
        }
      }
    };

    // Check for updates every 2 seconds
    const intervalId = setInterval(handleStorageChange, 2000);

    // Also listen to custom event for immediate updates
    window.addEventListener('balanceUpdated', handleStorageChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('balanceUpdated', handleStorageChange);
    };
  }, [practiceCoins, realCoins, isAdmin, isSubscribed]);

  const handleLogin = (name: string, coins: number, id: string, cash: number, admin: boolean = false, subscribed: boolean = false, practice: number = 50, real: number = 0, seenTour: boolean = false) => {
    // Save all data to localStorage for persistence across refreshes
    localStorage.setItem('userId', id);
    localStorage.setItem('username', name);
    localStorage.setItem('isAdmin', String(admin));
    localStorage.setItem('isSubscribed', String(subscribed));
    // coins and cash parameters are actually practiceCoins and realCoins
    localStorage.setItem('userCoins', String(coins)); // Legacy - kept for compatibility
    localStorage.setItem('cashBalance', String(cash)); // Legacy - kept for compatibility
    localStorage.setItem('practiceCoins', String(practice));
    localStorage.setItem('realCoins', String(real));
    localStorage.setItem('hasSeenTour', String(seenTour));
    
    setUsername(name);
    setUserCoins(coins);
    setUserId(id);
    setCashBalance(cash);
    setIsAdmin(admin);
    setIsSubscribed(subscribed);
    setPracticeCoins(practice);
    setRealCoins(real);
    setHasSeenTour(seenTour);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isSubscribed');
    localStorage.removeItem('userCoins');
    localStorage.removeItem('cashBalance');
    localStorage.removeItem('practiceCoins');
    localStorage.removeItem('realCoins');
    localStorage.removeItem('hasSeenTour');
    
    setUsername('');
    setUserId('');
    setUserCoins(100);
    setCashBalance(0);
    setIsAdmin(false);
    setIsSubscribed(false);
    setPracticeCoins(50);
    setRealCoins(0);
    setIsAuthenticated(false);
  };

  // Wrap everything in BrowserRouter so routes work everywhere
  return (
    <BrowserRouter>
      <AppContent 
        username={username}
        practiceCoins={practiceCoins}
        realCoins={realCoins}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        isAuthenticated={isAuthenticated}
        userCoins={userCoins}
        cashBalance={cashBalance}
        isSubscribed={isSubscribed}
        userId={userId}
        hasSeenTour={hasSeenTour}
        onLogin={handleLogin}
      />
    </BrowserRouter>
  );
}

export default App;
