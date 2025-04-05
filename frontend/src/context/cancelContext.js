// 📁 src/context/cancelContext.js
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import cancelService from '../services/cancelService';

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

  const checkRefundEligibility = useCallback(async (txnID) => {
    dispatch({ type: 'CHECK_REFUND_REQUEST' });
    try {
      const data = await cancelService.verifyRefundEligibility(txnID);
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
  }, []);

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
