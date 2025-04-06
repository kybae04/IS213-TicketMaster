import React, { createContext, useContext, useReducer, useCallback } from 'react';
import buyTicketService from '../services/buyTicketService';

const initialState = {
  availability: null,
  loading: false,
  error: null,
};

const BuyTicketContext = createContext(initialState);

const buyTicketReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_AVAILABILITY_REQUEST':
      return { ...state, loading: true, error: null };
    case 'FETCH_AVAILABILITY_SUCCESS':
      return { ...state, loading: false, availability: action.payload };
    case 'FETCH_AVAILABILITY_FAILURE':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const BuyTicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(buyTicketReducer, initialState);

  // Function to fetch seat availability for all categories
  const getAvailabilityByCat = useCallback(async (eventID) => {
    dispatch({ type: 'FETCH_AVAILABILITY_REQUEST' });
    try {
      // Define the categories
      const categories = ['vip', 'cat_1', 'cat_2', 'cat_3'];

      // Fetch availability for each category
      const availabilityPromises = categories.map(async (category) => {
        const numSeats = await buyTicketService.getAvailabilityByCat(eventID, category);
        return { area: category, quantity: numSeats };
      });

      // Wait for all promises to resolve
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

      // Return default empty availability on failure
      return [
        { area: 'vip', quantity: 0 },
        { area: 'cat_1', quantity: 0 },
        { area: 'cat_2', quantity: 0 },
        { area: 'cat_3', quantity: 0 },
      ];
    }
  }, []);

  return (
    <BuyTicketContext.Provider value={{ ...state, getAvailabilityByCat }}>
      {children}
    </BuyTicketContext.Provider>
  );
};

export const useBuyTicket = () => useContext(BuyTicketContext);