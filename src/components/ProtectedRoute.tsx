import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import { selectCanAccessRoute } from '../store/selectors/authSelectors';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { canAccess, shouldRedirect, isLoading } = useAppSelector(selectCanAccessRoute);
  
  // Render children immediately if access is granted, even during loading
  // This prevents component unmounting during auth state changes
  if (canAccess) {
    return children;
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (shouldRedirect) {
    return <Navigate to="/login" replace />;
  }
  
  return null;
};

export default ProtectedRoute;