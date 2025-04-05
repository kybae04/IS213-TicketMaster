import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentSession, getCurrentUser, signOut, signIn } from '../services/authService';
import supabase from '../supabaseClient';
import { getBackendUserId } from '../utils/userUtils';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [backendUserId, setBackendUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch and set the backend user ID
  const fetchBackendUserId = async (userData) => {
    if (!userData) {
      setBackendUserId(null);
      return;
    }
    
    try {
      const backendId = await getBackendUserId(userData);
      setBackendUserId(backendId);
      console.log("Backend User ID set:", backendId);
    } catch (error) {
      console.error("Error fetching backend user ID:", error);
      setBackendUserId(null);
    }
  };

  // Initialize authentication state
  useEffect(() => {
    async function init() {
      try {
        const session = await getCurrentSession();
        if (session?.session) {
          const userData = await getCurrentUser();
          setUser(userData);
          
          // Get the backend user ID
          await fetchBackendUserId(userData);
        }
      } catch (error) {
        // Silent failure
      } finally {
        setLoading(false);
      }
      
      // Listen for auth changes with Supabase
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            const user = await getCurrentUser();
            setUser(user);
            
            // Get the backend user ID when user signs in
            await fetchBackendUserId(user);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setBackendUserId(null);
          }
        }
      );

      // Cleanup function
      return () => {
        if (authListener && authListener.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    }
    
    init();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await signIn(email, password);
      if (data.user) {
        setUser(data.user);
        
        // Get the backend user ID after login
        await fetchBackendUserId(data.user);
        
        return data;
      }
      throw new Error('Login failed');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("Starting logout process in AuthContext");
      const result = await signOut();
      console.log("signOut result in AuthContext:", result);
      
      if (result) {
        console.log("Setting user to null in AuthContext");
        setUser(null);
        setBackendUserId(null);
        return true;
      } else {
        console.error("signOut returned unexpected result:", result);
        return false;
      }
    } catch (error) {
      console.error("Error in AuthContext logout:", error);
      return false;
    }
  };
  
  // Check current auth state - useful for debug page
  const checkAuthState = async () => {
    try {
      const session = await getCurrentSession();
      if (session?.session) {
        const userData = await getCurrentUser();
        setUser(userData);
        
        // Also refresh the backend user ID
        await fetchBackendUserId(userData);
        
        return !!userData;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Make auth state available to consumers
  const value = {
    user,
    backendUserId,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    checkAuthState
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 