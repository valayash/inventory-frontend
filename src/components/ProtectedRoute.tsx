import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const token = localStorage.getItem('access_token');
  const userInfo = localStorage.getItem('user_info');

  // Check if user is authenticated
  if (!token || !userInfo) {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required, check it
  if (requiredRole) {
    const user = JSON.parse(userInfo);
    if (user.role !== requiredRole) {
      // Redirect to appropriate dashboard based on actual role
      if (user.role === 'DISTRIBUTOR') {
        return <Navigate to="/distributor" replace />;
      } else if (user.role === 'SHOP_OWNER') {
        return <Navigate to="/shop-owner" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 