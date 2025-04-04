import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import EventDetailsPage from './pages/EventDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyTicketsPage from './pages/MyTicketsPage';
import ProfilePage from './pages/ProfilePage';
import TradingPage from './pages/TradingPage';
import TradeSuccessPage from './pages/TradeSuccessPage';
import CancellationSuccessPage from './pages/CancellationSuccessPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
import Navbar from './components/Navbar';
import PageLayout from './components/PageLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import RouteTransition from './components/RouteTransition';
import { EventProvider } from './context/EventContext';
import { MyTicketProvider } from './context/myTicketsContext';
import ApiTester from './components/ApiTester';
import { CancelProvider } from './context/cancelContext';

// Force dark mode
document.documentElement.classList.add('dark');

// Development environment flag
const isDev = process.env.NODE_ENV === 'development';

function App() {
  return (
    <Router>
      <EventProvider>
        <AuthProvider>
          <MyTicketProvider>
            <CancelProvider>
            <div className="App">
              <AppRoutes />
              {isDev && <ApiTester />}
            </div>
            </CancelProvider>
          </MyTicketProvider>
        </AuthProvider>
      </EventProvider>
    </Router>
  );
}

// Separate component for routes to access auth context
function AppRoutes() {
  // Import useAuth here inside the Router context
  const { isAuthenticated } = require('./context/AuthContext').useAuth();

  // Wrapper function to apply PageLayout to all routes
  const withLayout = (Component) => (
    <PageLayout>
      <Component />
    </PageLayout>
  );

  return (
    <RouteTransition>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={withLayout(HomePage)} />
        <Route path="/event/:id" element={withLayout(EventDetailsPage)} />
        <Route path="/login" element={withLayout(LoginPage)} />
        <Route path="/register" element={withLayout(RegisterPage)} />
        <Route path="/checkout" element={withLayout(CheckoutPage)} />
        <Route path="/payment-confirmation" element={withLayout(PaymentConfirmationPage)} />

        {/* Protected routes using Outlet pattern */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/my-tickets" element={withLayout(MyTicketsPage)} />
          <Route path="/profile" element={withLayout(ProfilePage)} />
          <Route path="/trading" element={withLayout(TradingPage)} />
          <Route path="/trade-success" element={withLayout(TradeSuccessPage)} />
          <Route path="/cancellation-success" element={withLayout(CancellationSuccessPage)} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </RouteTransition>
  );
}

export default App;
