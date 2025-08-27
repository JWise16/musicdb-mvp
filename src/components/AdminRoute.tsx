import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import { selectCanAccessAdminRoute, selectCanAccessSuperAdminRoute } from '../store/selectors/authSelectors';

interface AdminRouteProps {
  children: React.ReactElement;
  requireSuperAdmin?: boolean;
}

const AdminRoute = ({ children, requireSuperAdmin = false }: AdminRouteProps) => {
  const adminAccess = useAppSelector(selectCanAccessAdminRoute);
  const superAdminAccess = useAppSelector(selectCanAccessSuperAdminRoute);
  
  // Choose the appropriate access check based on requirements
  const { canAccess, shouldRedirect, isLoading } = requireSuperAdmin ? superAdminAccess : adminAccess;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }
  
  if (shouldRedirect) {
    const redirectTo = requireSuperAdmin ? '/admin' : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }
  
  return canAccess ? children : null;
};

export default AdminRoute;