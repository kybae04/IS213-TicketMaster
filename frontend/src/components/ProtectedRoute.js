import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

function ProtectedRoute({ isAuthenticated, children }) {
  const location = useLocation();
  
  if (!isAuthenticated) {
    // Save the current location the user was trying to navigate to
    return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
  }

  // If we have children, render them, otherwise render the Outlet for nested routes
  return children ? children : <Outlet />;
}

export default ProtectedRoute; 