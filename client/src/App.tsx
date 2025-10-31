import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/auth/Auth.tsx';
import Dashboard from './components/pages/Dashboard.tsx';
import Navigation from './components/layout/Navigation.tsx';
import ProfilePage from './components/pages/ProfilePage.tsx';
import ProtectedRoute from './components/common/ProtectedRoute.tsx';
import AdminRoute from './components/common/AdminRoute.tsx';
import AdminDashboard from './components/admin/AdminDashboard.tsx';
import AdminUsers from './components/admin/AdminUsers.tsx';
import AdminTransactions from './components/admin/AdminTransactions.tsx';
import AdminSubscriptionRequests from './components/admin/AdminSubscriptionRequests.tsx';
import AdminProfile from './components/admin/AdminProfile.tsx';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [userCoins, setUserCoins] = useState(100);
  const [userId, setUserId] = useState('');
  const [cashBalance, setCashBalance] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false); // Track admin status

  const handleLogin = (name: string, coins: number, id: string, cash: number, admin: boolean = false) => {
    setUsername(name);
    setUserCoins(coins);
    setUserId(id);
    setCashBalance(cash);
    setIsAdmin(admin);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUsername('');
    setUserId('');
    setUserCoins(100);
    setCashBalance(0);
    setIsAdmin(false);
    setIsAuthenticated(false);
  };

  // If not authenticated, show login/register screen
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
          isAdmin={isAdmin}
        />
        
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
              <Dashboard 
                username={username} 
                coins={userCoins}
                userId={userId}
                initialCashBalance={cashBalance}
              />
            } 
          />
          
          {/* Profile - Different for Admin vs Regular Users */}
          <Route 
            path="/profile" 
            element={
              isAdmin ? (
                <AdminProfile 
                  username={username}
                  onLogout={handleLogout}
                />
              ) : (
                <ProfilePage 
                  username={username}
                  coins={userCoins}
                  cashBalance={cashBalance}
                  userId={userId}
                />
              )
            } 
          />
          
          {/* 
            Game Route - Protected by balance requirement
            Requires minimum 10 coins or ₹10 to play
            Currently disabled as game is not implemented yet
          */}
          <Route 
            path="/game" 
            element={
              <ProtectedRoute
                requireBalance={true}
                minBalance={10}
                userCoins={userCoins}
                cashBalance={cashBalance}
                redirectTo="/dashboard"
              >
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: '#ffd700',
                  fontSize: '1.5rem'
                }}>
                  🎮 Game Coming Soon!
                  <p style={{ fontSize: '1rem', color: '#a0a0a0', marginTop: '1rem' }}>
                    The game feature is currently under development.
                  </p>
                </div>
              </ProtectedRoute>
            } 
          />
          
          {/* 
            Leaderboard Route - Currently disabled
            Will be implemented in future
          */}
          <Route 
            path="/leaderboard" 
            element={
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#ffd700',
                fontSize: '1.5rem'
              }}>
                🏆 Leaderboard Coming Soon!
                <p style={{ fontSize: '1rem', color: '#a0a0a0', marginTop: '1rem' }}>
                  The leaderboard feature is currently under development.
                </p>
              </div>
            } 
          />
          
          {/* Catch-all route - redirect any unknown path to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
            {/* Admin routes - protected by admin flag */}
            <Route path="/admin" element={
            <AdminRoute isAdmin={isAdmin}>
              <AdminDashboard />
            </AdminRoute>
            } />
            <Route path="/admin/users" element={
            <AdminRoute isAdmin={isAdmin}>
              <AdminUsers />
            </AdminRoute>
            } />
            <Route path="/admin/transactions" element={
            <AdminRoute isAdmin={isAdmin}>
              <AdminTransactions />
            </AdminRoute>
            } />
            <Route path="/admin/subscriptions" element={
            <AdminRoute isAdmin={isAdmin}>
              <AdminSubscriptionRequests />
            </AdminRoute>
            } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
