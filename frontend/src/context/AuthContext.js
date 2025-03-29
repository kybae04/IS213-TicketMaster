import React, { createContext, useState, useEffect, useContext } from 'react';
import { getCurrentSession, getCurrentUser, signOut, signIn } from '../services/authService';
import supabase from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    async function init() {
      try {
        const session = await getCurrentSession();
        if (session?.session) {
          const userData = await getCurrentUser();
          setUser(userData);
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
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
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