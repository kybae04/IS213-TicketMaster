import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ isAuthenticated, children }) {
  const location = useLocation();
  const { loading, initialized } = useAuth();
  const [authCheckInProgress, setAuthCheckInProgress] = useState(false);
  
  // Check if auth check is in progress from localStorage
  useEffect(() => {
    const checkStatus = () => {
      const status = localStorage.getItem('authCheckInProgress') === 'true';
      setAuthCheckInProgress(status);
    };
    
    // Initial check
    checkStatus();
    
    // Listen for changes to localStorage
    const handleStorage = () => {
      checkStatus();
    };
    
    window.addEventListener('storage', handleStorage);
    
    // Check periodically while auth check is in progress
    const interval = setInterval(() => {
      checkStatus();
    }, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);
  
  // If still loading or auth check is in progress, don't redirect yet
  if (loading || authCheckInProgress) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 border-r-2 rounded-full mx-auto mb-2"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>;
  }
  
  if (!isAuthenticated && initialized) {
    // Save the current location the user was trying to navigate to
    return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
  }

  // If we have children, render them, otherwise render the Outlet for nested routes
  return children ? children : <Outlet />;
}

export default ProtectedRoute; 