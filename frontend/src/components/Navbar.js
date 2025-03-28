import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if current page is login or register
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  // Show navigation links only if authenticated or on homepage
  const shouldShowNavLinks = isAuthenticated || location.pathname === '/';

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");
      const result = await logout();
      console.log("Logout result:", result);
      if (result) {
        console.log("Logout successful, navigating to login page");
        navigate('/login');
      } else {
        console.error("Logout returned false");
        alert("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error('Error logging out:', error);
      alert(`Logout error: ${error.message || 'Unknown error'}`);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-xl border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-white text-3xl font-bold tracking-tight">
                TicketMaster
                <span className="ml-1 relative inline-block">
                  <span className="text-blue-400 glow-text-navbar">2.0</span>
                </span>
              </span>
            </Link>
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="flex items-baseline space-x-4">
              {/* Show Home link only if not on auth pages */}
              {!isAuthPage && (
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white hover:bg-blue-600/10 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Home
                </Link>
              )}
              
              {/* Show navigation links only if authenticated or on homepage */}
              {shouldShowNavLinks && isAuthenticated && (
                <>
                  <Link
                    to="/my-tickets"
                    className="text-gray-300 hover:text-white hover:bg-blue-600/10 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    My Tickets
                  </Link>
                  <Link
                    to="/trading"
                    className="text-gray-300 hover:text-white hover:bg-blue-600/10 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Trading
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300 text-sm">
                    {user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-white hover:bg-blue-600/10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
            {/* Mobile: Show Home link only if not on auth pages */}
            {!isAuthPage && (
              <Link
                to="/"
                className="text-gray-300 hover:bg-blue-600/10 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            )}
            
            {/* Mobile: Show navigation links only if authenticated */}
            {shouldShowNavLinks && isAuthenticated && (
              <>
                <Link
                  to="/my-tickets"
                  className="text-gray-300 hover:bg-blue-600/10 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Tickets
                </Link>
                <Link
                  to="/trading"
                  className="text-gray-300 hover:bg-blue-600/10 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Trading
                </Link>
              </>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700 bg-gray-800">
            <div className="px-2 space-y-1">
              {isAuthenticated ? (
                <>
                  <div className="text-gray-300 px-3 py-2">
                    {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-gray-300 hover:bg-blue-600/10 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-300 hover:bg-blue-600/10 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-gray-300 hover:bg-blue-600/10 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style jsx="true">{`
        .glow-text-navbar {
          text-shadow: 0 0 10px rgba(96, 165, 250, 0.7),
                       0 0 20px rgba(96, 165, 250, 0.5);
        }
      `}</style>
    </nav>
  );
}

export default Navbar; 