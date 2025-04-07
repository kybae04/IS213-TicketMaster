// 📁 src/context/cancelContext.js
import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import cancelService from '../services/cancelService';
import { useAuth } from './AuthContext';

const initialState = {
  refundEligibility: null,
  loading: false,
  error: null
};

const CancelContext = createContext(initialState);

const cancelReducer = (state, action) => {
  switch (action.type) {
    case 'CHECK_REFUND_REQUEST':
      return { ...state, loading: true, error: null };
    case 'CHECK_REFUND_SUCCESS':
      return { ...state, loading: false, refundEligibility: action.payload };
    case 'CHECK_REFUND_FAILURE':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const CancelProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cancelReducer, initialState);
  const { backendUserId, user, loading: authLoading } = useAuth();
  // Store the latest used backend user ID to detect changes
  const lastUsedUserIdRef = useRef(null);

  const checkRefundEligibility = useCallback(async (eventID) => {
    // For debugging
    console.log('Current backendUserId:', backendUserId);
    console.log('Current user:', user?.email, user?.id);
    
    // Update the last used user ID
    lastUsedUserIdRef.current = backendUserId;

    dispatch({ type: 'CHECK_REFUND_REQUEST' });
    try {
      if (!backendUserId) {
        throw new Error('No backend user ID found. Please ensure you are logged in with a valid account.');
      }
      console.log('Fetching tickets for user:', backendUserId);
      const data = await cancelService.verifyRefundEligibility(eventID, backendUserId);
      dispatch({ type: 'CHECK_REFUND_SUCCESS', payload: data });
      console.log('Refund eligibility data:', data);
      return data;
    } catch (error) {
      dispatch({
        type: 'CHECK_REFUND_FAILURE',
        payload: error.message || 'Failed to check refund eligibility'
      });
      return { refund_eligibility: false, message: 'Error checking refund eligibility' };
    }
  }, [backendUserId, user]);

  // Debug logging for auth context values
  useEffect(() => {
    console.log('Auth context in MyTicketsContext:', {
      backendUserId,
      userEmail: user?.email,
      userID: user?.id,
      authLoading
    });
  }, [backendUserId, user, authLoading]);

  const cancelTicket = useCallback(async (txnID, refundEligibility) => {
    dispatch({ type: 'CHECK_REFUND_REQUEST' }); // reuse loading state
    try {
      const data = await cancelService.cancelTicket(txnID, refundEligibility);
      dispatch({ type: 'CHECK_REFUND_SUCCESS', payload: null }); // reset eligibility
      return data;
    } catch (error) {
      dispatch({
        type: 'CHECK_REFUND_FAILURE',
        payload: error.message || 'Failed to cancel ticket'
      });
      throw error;
    }
  }, []);


  return (
    <CancelContext.Provider value={{ ...state, checkRefundEligibility, cancelTicket }}>
      {children}
    </CancelContext.Provider>
  );
};

export const useCancel = () => useContext(CancelContext);
