import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  redirectTo?: string;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, isAdmin = false, redirectTo = '/dashboard' }) => {
  if (!isAdmin) {
    // Not an admin - redirect to dashboard
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
