import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import buyTicketService from '../services/buyTicketService';
import { useAuth } from './AuthContext';

const initialState = {
  availability: null,
  loading: false,
  error: null,
};

const BuyTicketContext = createContext(initialState);

const buyTicketReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_AVAILABILITY_REQUEST':
    case 'LOCK_TICKET_REQUEST':
    case 'CONFIRM_PAYMENT_REQUEST':
    case 'TIMEOUT_REQUEST':
      return { ...state, loading: true, error: null };
    case 'FETCH_AVAILABILITY_SUCCESS':
    case 'LOCK_TICKET_SUCCESS':
    case 'CONFIRM_PAYMENT_SUCCESS':
    case 'TIMEOUT_SUCCESS':
      return { ...state, loading: false, availability: action.payload };
    case 'FETCH_AVAILABILITY_FAILURE':
    case 'LOCK_TICKET_FAILURE':
    case 'CONFIRM_PAYMENT_FAILURE':
    case 'TIMEOUT_FAILURE':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const BuyTicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(buyTicketReducer, initialState);
  const { backendUserId, user, loading: authLoading } = useAuth()

  const lastUsedUserIdRef = useRef(null);

  const getAvailabilityByCat = useCallback(async (eventID) => {
    dispatch({ type: 'FETCH_AVAILABILITY_REQUEST' });
    try {
      const categories = ['vip', 'cat_1', 'cat_2', 'cat_3'];
      const availabilityPromises = categories.map(async (category) => {
        const numSeats = await buyTicketService.getAvailabilityByCat(eventID, category);
        return { area: category, quantity: numSeats };
      });
      const availability = await Promise.all(availabilityPromises);
      dispatch({ type: 'FETCH_AVAILABILITY_SUCCESS', payload: availability });
      console.log('Fetched availability data:', availability);
      return availability;
    } catch (error) {
      dispatch({
        type: 'FETCH_AVAILABILITY_FAILURE',
        payload: error.message || 'Failed to fetch availability',
      });
      console.error('Error fetching availability:', error);
      return [
        { area: 'vip', quantity: 0 },
        { area: 'cat_1', quantity: 0 },
        { area: 'cat_2', quantity: 0 },
        { area: 'cat_3', quantity: 0 },
      ];
    }
  }, []);

  const lockTicket = useCallback(async (eventID, categoryID, quantity) => {
    // For debugging
    console.log('Current backendUserId:', backendUserId);
    console.log('Current user:', user?.email, user?.id);

    // Update the last used user ID
    lastUsedUserIdRef.current = backendUserId;

    dispatch({ type: 'LOCK_TICKET_REQUEST' });
    try {
      if (!backendUserId) {
        throw new Error('No backend user ID found. Please ensure you are logged in with a valid account.');
      }

      console.log(`Locking tickets for ${backendUserId}`)
      const data = await buyTicketService.lockTicket(eventID, categoryID, backendUserId, quantity);
      dispatch({ type: 'LOCK_TICKET_SUCCESS', payload: data });
      console.log('Locked ticket data:', data);
      return data;
    } catch (error) {
      dispatch({
        type: 'LOCK_TICKET_FAILURE',
        payload: error.message || 'Failed to lock ticket',
      });
      throw error;
    }
  }, [backendUserId, user])

  const confirmPayment = useCallback(async (eventID, categoryID, quantity) => {
    console.log('Current backendUserId:', backendUserId);
    console.log('Current user:', user?.email, user?.id);

    // Update the last used user ID
    lastUsedUserIdRef.current = backendUserId;
    dispatch({ type: 'CONFIRM_PAYMENT_REQUEST' });
    try {
      if (!backendUserId) {
        throw new Error('No backend user ID found. Please ensure you are logged in with a valid account.');
      }

      console.log(`Making payment for ${backendUserId}`)
      const data = await buyTicketService.confirmPayment(eventID, categoryID, backendUserId, quantity);
      dispatch({ type: 'CONFIRM_PAYMENT_SUCCESS', payload: data });
      console.log('Confirmed payment data:', data);
      return data;
    } catch (error) {
      dispatch({
        type: 'CONFIRM_PAYMENT_FAILURE',
        payload: error.message || 'Failed to confirm payment',
      });
      throw error;
    }
  }, [backendUserId, user])


  const timeout = useCallback(async (eventID, categoryID) => {
    console.log('Current backendUserId:', backendUserId);
    console.log('Current user:', user?.email, user?.id);

    // Update the last used user ID
    lastUsedUserIdRef.current = backendUserId;
    dispatch({ type: 'TIMEOUT_REQUEST' });
    try {
      if (!backendUserId) {
        throw new Error('No backend user ID found. Please ensure you are logged in with a valid account.');
      }

      console.log(`Timeout for ${backendUserId}`)
      const data = await buyTicketService.timeout(eventID, categoryID, backendUserId);
      dispatch({ type: 'TIMEOUT_SUCCESS', payload: data });
      console.log('Timeout data:', data);
      return data;
    } catch (error) {
      dispatch({
        type: 'TIMEOUT_FAILURE',
        payload: error.message || 'Failed to handle timeout',
      });
      throw error;
    }
  }, [backendUserId, user])


  // Debug logging for auth context values
  useEffect(() => {
    console.log('Auth context in BuyTicketsContext:', {
      backendUserId,
      userEmail: user?.email,
      userID: user?.id,
      authLoading
    });
  }, [backendUserId, user, authLoading]);

  return (
    <BuyTicketContext.Provider value={{ ...state, getAvailabilityByCat, lockTicket, confirmPayment, timeout }}>
      {children}
    </BuyTicketContext.Provider>
  );
};

export const useBuyTicket = () => useContext(BuyTicketContext);