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

  return (
    <BuyTicketContext.Provider value={{ ...state, getAvailabilityByCat }}>
      {children}
    </BuyTicketContext.Provider>
  );
};

export const useBuyTicket = () => useContext(BuyTicketContext);