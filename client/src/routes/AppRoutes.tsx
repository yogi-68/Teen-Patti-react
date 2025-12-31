import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AdminRoute from '../components/common/AdminRoute';

// Auth
import Auth from '../components/auth/Auth';

// Pages
import Dashboard from '../components/pages/Dashboard';
import GamePage from '../components/pages/GamePage';
import GameSelectionPage from '../components/pages/GameSelectionPage';
import ProfilePage from '../components/pages/ProfilePage';
import WalletPage from '../components/pages/WalletPage';
import SettingsPage from '../components/pages/SettingsPage';

// Admin
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminUsers from '../components/admin/AdminUsers';
import AdminTransactions from '../components/admin/AdminTransactions';
import AdminTips from '../components/admin/AdminTips';
import AdminSubscriptionRequests from '../components/admin/AdminSubscriptionRequests';
import AdminProfile from '../components/admin/AdminProfile';
import BotManagement from '../components/admin/BotManagement';
import TableSeatManager from '../components/admin/TableSeatManager';
import BotMonitoring from '../components/admin/BotMonitoring';
import EnquiryManagement from '../components/admin/EnquiryManagement';
import AdminPasswordResetRequests from '../components/admin/AdminPasswordResetRequests';

interface AppRoutesProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  username: string;
  userId: string;
  practiceTrial: number;
  realToken: number;
  userTrial: number;
  tokenBalance: number;
  isSubscribed: boolean;
  hasSeenTour: boolean;
  onLogin: (name: string, coins: number, id: string, cash: number, admin?: boolean, subscribed?: boolean, practice?: number, real?: number, seenTour?: boolean) => void;
  onLogout: () => void;
}

const AppRoutes: React.FC<AppRoutesProps> = ({
  isAuthenticated,
  isAdmin,
  username,
  userId,
  practiceTrial,
  realToken,
  userTrial,
  tokenBalance,
  isSubscribed,
  hasSeenTour,
  onLogin,
  onLogout
}) => {
  return (
    <Routes>
      {/* Public Routes - Only accessible when NOT authenticated */}
      <Route 
        path="/login" 
        element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Auth onLogin={onLogin} />
          </PublicRoute>
        } 
      />
      
      {/* Root - Redirect based on authentication */}
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
            : <Navigate to="/login" replace />
        } 
      />

      {/* Protected Routes - Require authentication */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Dashboard 
              username={username} 
              coins={userTrial}
              initialTokenBalance={tokenBalance}
              isSubscribed={isSubscribed}
              userId={userId}
              hasSeenTour={hasSeenTour}
            />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            {isAdmin ? (
              <AdminProfile 
                username={username}
                onLogout={onLogout}
              />
            ) : (
              <ProfilePage 
                username={username}
                practiceTrial={practiceTrial}
                realToken={realToken}
                userId={userId}
                isSubscribed={isSubscribed}
              />
            )}
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/wallet" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <WalletPage 
              userId={userId}
              practiceTrial={practiceTrial}
              realToken={realToken}
              isSubscribed={isSubscribed}
            />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <SettingsPage 
              username={username}
              userId={userId}
            />
          </ProtectedRoute>
        } 
      />
      
      {/* Game Routes */}
      <Route 
        path="/game" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <GameSelectionPage 
              username={username}
              trial={practiceTrial}
              tokenBalance={realToken}
              isSubscribed={isSubscribed}
              userId={userId}
            />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/game/teen-patti" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <GamePage />
          </ProtectedRoute>
        } 
      />
      
      {/* Leaderboard */}
      <Route 
        path="/leaderboard" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
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
          </ProtectedRoute>
        } 
      />

      {/* Admin Routes - Require authentication AND admin privileges */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminRoute isAdmin={isAdmin}>
              <AdminDashboard />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminRoute isAdmin={isAdmin}>
              <AdminUsers />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/transactions" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminRoute isAdmin={isAdmin}>
              <AdminTransactions />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/tips" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminRoute isAdmin={isAdmin}>
              <AdminTips />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/subscriptions" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminRoute isAdmin={isAdmin}>
              <AdminSubscriptionRequests />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/enquiries" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminRoute isAdmin={isAdmin}>
              <EnquiryManagement adminId={userId} adminUsername={username} />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/bots" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminRoute isAdmin={isAdmin}>
              <BotManagement />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/table-seats" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminRoute isAdmin={isAdmin}>
              <TableSeatManager />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/bot-monitoring" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminRoute isAdmin={isAdmin}>
              <BotMonitoring />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/password-resets" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AdminRoute isAdmin={isAdmin}>
              <AdminPasswordResetRequests />
            </AdminRoute>
          </ProtectedRoute>
        } 
      />
      
      {/* 404 - Catch all unknown routes */}
      <Route 
        path="*" 
        element={
          isAuthenticated 
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
