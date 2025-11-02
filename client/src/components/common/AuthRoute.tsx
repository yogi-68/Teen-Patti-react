import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AuthRouteProps {
  children: ReactNode;
  isAuthenticated: boolean;
  redirectTo?: string;
}

/**
 * AuthRoute - Protects routes that require authentication
 * Redirects to login if user is not authenticated
 */
const AuthRoute: React.FC<AuthRouteProps> = ({ 
  children, 
  isAuthenticated, 
  redirectTo = '/' 
}) => {
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default AuthRoute;
