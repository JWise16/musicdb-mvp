import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

interface AdminRouteProps {
  children: React.ReactElement;
  requireSuperAdmin?: boolean;
}

const AdminRoute = ({ children, requireSuperAdmin = false }: AdminRouteProps) => {
  const { canViewAdminDashboard, isSuperAdmin, loading } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }
  
  // Check if user has admin access
  if (!canViewAdminDashboard) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Check if super admin is required
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

export default AdminRoute;