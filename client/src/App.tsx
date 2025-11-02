import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Auth from './components/auth/Auth.tsx';
import Dashboard from './components/pages/Dashboard.tsx';
import GamePage from './components/pages/GamePage.tsx';
import Navigation from './components/layout/Navigation.tsx';
import ProfilePage from './components/pages/ProfilePage.tsx';
import WalletPage from './components/pages/WalletPage.tsx';
import AdminRoute from './components/common/AdminRoute.tsx';
import AuthRoute from './components/common/AuthRoute.tsx';
import AdminDashboard from './components/admin/AdminDashboard.tsx';
import AdminUsers from './components/admin/AdminUsers.tsx';
import AdminTransactions from './components/admin/AdminTransactions.tsx';
import AdminSubscriptionRequests from './components/admin/AdminSubscriptionRequests.tsx';
import AdminProfile from './components/admin/AdminProfile.tsx';
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
  userId
}: any) {
  const location = useLocation();
  const hideNavigation = location.pathname === '/game';

  return (
    <div className="app">
      {!hideNavigation && (
        <Navigation 
          username={username}
          coins={practiceCoins}
          cashBalance={realCoins}
          onLogout={onLogout}
          isAdmin={isAdmin}
        />
      )}
      
      <Routes>
        {/* Default route - redirect based on user type */}
        <Route 
          path="/" 
          element={<Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />} 
        />
        
        {/* Dashboard - Always accessible when authenticated */}
        <Route 
          path="/dashboard" 
          element={
            <AuthRoute isAuthenticated={isAuthenticated}>
              <Dashboard 
                username={username} 
                coins={userCoins}
                initialCashBalance={cashBalance}
                isSubscribed={isSubscribed}
                userId={userId}
              />
            </AuthRoute>
          } 
        />
        
        {/* Profile - Different for Admin vs Regular Users */}
        <Route 
          path="/profile" 
          element={
            <AuthRoute isAuthenticated={isAuthenticated}>
              {isAdmin ? (
                <AdminProfile 
                  username={username}
                  onLogout={onLogout}
                />
              ) : (
                <ProfilePage 
                  username={username}
                  coins={userCoins}
                  cashBalance={cashBalance}
                  userId={userId}
                  isSubscribed={isSubscribed}
                />
              )}
            </AuthRoute>
          } 
        />
        
        {/* Wallet - Subscription and Transactions */}
        <Route 
          path="/wallet" 
          element={
            <AuthRoute isAuthenticated={isAuthenticated}>
              <WalletPage 
                userId={userId}
                practiceCoins={practiceCoins}
                realCoins={realCoins}
                isSubscribed={isSubscribed}
              />
            </AuthRoute>
          } 
        />
        
        {/* Game Route - Actual Game Page */}
        <Route 
          path="/game" 
          element={
            <AuthRoute isAuthenticated={isAuthenticated}>
              <GamePage />
            </AuthRoute>
          } 
        />
        
        {/* Leaderboard Route - Coming Soon */}
        <Route 
          path="/leaderboard" 
          element={
            <AuthRoute isAuthenticated={isAuthenticated}>
              <div style={{ 
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
                color: '#ffd700',
                textAlign: 'center',
                padding: '2rem'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  padding: '3rem',
                  borderRadius: '20px',
                  border: '3px solid #ffd700',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
                }}>
                  <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏆</div>
                  <h1 style={{ fontSize: '2.5rem', margin: '1rem 0', color: '#ffd700' }}>
                    Leaderboard Coming Soon!
                  </h1>
                  <p style={{ fontSize: '1.2rem', color: '#a0a0a0', marginTop: '1rem', maxWidth: '600px' }}>
                    Compete with other players and climb the ranks!
                  </p>
                </div>
              </div>
            </AuthRoute>
          } 
        />

        {/* Admin routes - protected by authentication and admin flag */}
        <Route 
          path="/admin" 
          element={
            <AuthRoute isAuthenticated={isAuthenticated}>
              <AdminRoute isAdmin={isAdmin}>
                <AdminDashboard />
              </AdminRoute>
            </AuthRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <AuthRoute isAuthenticated={isAuthenticated}>
              <AdminRoute isAdmin={isAdmin}>
                <AdminUsers />
              </AdminRoute>
            </AuthRoute>
          } 
        />
        <Route 
          path="/admin/transactions" 
          element={
            <AuthRoute isAuthenticated={isAuthenticated}>
              <AdminRoute isAdmin={isAdmin}>
                <AdminTransactions />
              </AdminRoute>
            </AuthRoute>
          } 
        />
        <Route 
          path="/admin/subscriptions" 
          element={
            <AuthRoute isAuthenticated={isAuthenticated}>
              <AdminRoute isAdmin={isAdmin}>
                <AdminSubscriptionRequests />
              </AdminRoute>
            </AuthRoute>
          } 
        />
        
        {/* Catch-all route - redirect any unknown path to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
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

  const handleLogin = (name: string, coins: number, id: string, cash: number, admin: boolean = false, subscribed: boolean = false, practice: number = 50, real: number = 0) => {
    console.log('🔐 App.tsx handleLogin called with:', { name, coins, id, cash, admin, subscribed, practice, real });
    
    // Save all data to localStorage for persistence across refreshes
    localStorage.setItem('userId', id);
    localStorage.setItem('username', name);
    localStorage.setItem('isAdmin', String(admin));
    localStorage.setItem('isSubscribed', String(subscribed));
    localStorage.setItem('userCoins', String(coins));
    localStorage.setItem('cashBalance', String(cash));
    localStorage.setItem('practiceCoins', String(practice));
    localStorage.setItem('realCoins', String(real));
    
    setUsername(name);
    setUserCoins(coins);
    setUserId(id);
    setCashBalance(cash);
    setIsAdmin(admin);
    setIsSubscribed(subscribed);
    setPracticeCoins(practice);
    setRealCoins(real);
    setIsAuthenticated(true);
    console.log('✅ App state updated - isAdmin:', admin);
    console.log('✅ Saved to localStorage - userId:', id);
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

  // If not authenticated, show login/register screen
  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

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
      />
    </BrowserRouter>
  );
}

export default App;
