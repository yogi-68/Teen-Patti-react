import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

/**
 * PublicRoute - Redirects to dashboard if user is already authenticated
 * Used for login/register pages
 */
const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  isAuthenticated 
}) => {
  if (isAuthenticated) {
    // User is already logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
