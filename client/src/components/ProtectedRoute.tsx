import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireBalance?: boolean;
  minBalance?: number;
  userCoins?: number;
  cashBalance?: number;
  redirectTo?: string;
}

/**
 * ProtectedRoute - Guards routes based on balance requirements
 * 
 * @param requireBalance - Requires minimum balance to access
 * @param minBalance - Minimum balance required (checks coins OR cash)
 * @param userCoins - User's current coin balance
 * @param cashBalance - User's current cash balance
 * @param redirectTo - Where to redirect if requirements not met
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireBalance = false,
  minBalance = 0,
  userCoins = 0,
  cashBalance = 0,
  redirectTo = '/dashboard'
}) => {
  // Check if user meets balance requirements
  if (requireBalance) {
    const hasEnoughBalance = userCoins >= minBalance || cashBalance >= minBalance;
    
    if (!hasEnoughBalance) {
      // Show alert and redirect
      setTimeout(() => {
        alert(
          `Insufficient Balance!\n\n` +
          `This feature requires at least ${minBalance} coins or ₹${minBalance}.\n\n` +
          `Your current balance:\n` +
          `🪙 Coins: ${userCoins}\n` +
          `₹ Cash: ${cashBalance}\n\n` +
          `Please add cash or earn more coins to access this feature.`
        );
      }, 100);
      
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
