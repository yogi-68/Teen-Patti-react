import { useState, useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Navigation from './components/layout/Navigation.tsx';
import AppRoutes from './routes/AppRoutes.tsx';
import SoundManager from './utils/SoundManager.ts';
import './App.css';

// Component to conditionally show navigation
function AppContent({ 
  username, 
  practiceTrial, 
  realToken, 
  onLogout, 
  isAdmin,
  isAuthenticated,
  userTrial,
  tokenBalance,
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
          coins={practiceTrial}
          tokenBalance={realToken}
          onLogout={onLogout}
          isAdmin={isAdmin}
        />
      )}
      
      <AppRoutes
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
        username={username}
        userId={userId}
        practiceTrial={practiceTrial}
        realToken={realToken}
        userTrial={userTrial}
        tokenBalance={tokenBalance}
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

  // Start application background music
  useEffect(() => {
    const startMusic = () => {
      SoundManager.playBackgroundMusic();
      // Remove listeners after first interaction
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
      document.removeEventListener('touchstart', startMusic);
    };

    // Try to start music immediately (may be blocked by browser autoplay policy)
    SoundManager.playBackgroundMusic();

    // Add event listeners for user interaction to start music if blocked
    document.addEventListener('click', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });
    document.addEventListener('touchstart', startMusic, { once: true });

    return () => {
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
      document.removeEventListener('touchstart', startMusic);
    };
  }, []);
  const [tokenBalance, setTokenBalance] = useState(() => {
    const saved = localStorage.getItem('tokenBalance');
    return saved ? Number(saved) : 0;
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('isSubscribed') === 'true';
  });
  const [practiceTrial, setPracticeTrial] = useState(() => {
    const saved = localStorage.getItem('practiceTrial');
    return saved ? Number(saved) : 50;
  });
  const [realToken, setRealToken] = useState(() => {
    const saved = localStorage.getItem('realToken');
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
          const newPracticeTrial = user.practiceTrial || 50;
          const newRealToken = user.realToken || 0;
          const newIsSubscribed = user.isSubscribed || false;
          
          if (newPracticeTrial !== practiceTrial) {
            setPracticeTrial(newPracticeTrial);
            localStorage.setItem('practiceTrial', String(newPracticeTrial));
          }
          
          if (newRealToken !== realToken) {
            setRealToken(newRealToken);
            setTokenBalance(newRealToken);
            localStorage.setItem('realToken', String(newRealToken));
            localStorage.setItem('tokenBalance', String(newRealToken));
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
      const savedPractice = localStorage.getItem('practiceTrial');
      const savedReal = localStorage.getItem('realToken');
      const savedIsAdmin = localStorage.getItem('isAdmin');
      const savedIsSubscribed = localStorage.getItem('isSubscribed');
      
      if (savedPractice) {
        const newPracticeTrial = Number(savedPractice);
        if (newPracticeTrial !== practiceTrial) {
          setPracticeTrial(newPracticeTrial);
        }
      }
      
      if (savedReal) {
        const newRealToken = Number(savedReal);
        if (newRealToken !== realToken) {
          setRealToken(newRealToken);
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
  }, [practiceTrial, realToken, isAdmin, isSubscribed]);

  const handleLogin = (name: string, coins: number, id: string, cash: number, admin: boolean = false, subscribed: boolean = false, practice: number = 50, real: number = 0, seenTour: boolean = false) => {
    // Save all data to localStorage for persistence across refreshes
    localStorage.setItem('userId', id);
    localStorage.setItem('username', name);
    localStorage.setItem('isAdmin', String(admin));
    localStorage.setItem('isSubscribed', String(subscribed));
    // trial and token parameters are actually practiceTrial and realToken
    localStorage.setItem('userCoins', String(coins)); // Legacy - kept for compatibility
    localStorage.setItem('tokenBalance', String(cash)); // Legacy - kept for compatibility
    localStorage.setItem('practiceTrial', String(practice));
    localStorage.setItem('realToken', String(real));
    localStorage.setItem('hasSeenTour', String(seenTour));
    
    setUsername(name);
    setUserCoins(coins);
    setUserId(id);
    setTokenBalance(cash);
    setIsAdmin(admin);
    setIsSubscribed(subscribed);
    setPracticeTrial(practice);
    setRealToken(real);
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
    localStorage.removeItem('tokenBalance');
    localStorage.removeItem('practiceTrial');
    localStorage.removeItem('realToken');
    localStorage.removeItem('hasSeenTour');
    
    setUsername('');
    setUserId('');
    setUserCoins(100);
    setTokenBalance(0);
    setIsAdmin(false);
    setIsSubscribed(false);
    setPracticeTrial(50);
    setRealToken(0);
    setIsAuthenticated(false);
  };

  // Wrap everything in BrowserRouter so routes work everywhere
  return (
    <BrowserRouter>
      <AppContent 
        username={username}
        practiceTrial={practiceTrial}
        realToken={realToken}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        isAuthenticated={isAuthenticated}
        userCoins={userCoins}
        tokenBalance={tokenBalance}
        isSubscribed={isSubscribed}
        userId={userId}
        hasSeenTour={hasSeenTour}
        onLogin={handleLogin}
      />
    </BrowserRouter>
  );
}

export default App;
