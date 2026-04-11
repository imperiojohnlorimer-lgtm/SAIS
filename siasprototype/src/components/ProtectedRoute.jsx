import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-red-600">
          Access Denied: You don't have permission to access this page
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
