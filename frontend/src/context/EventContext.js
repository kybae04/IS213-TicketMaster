import React, { createContext, useContext, useReducer } from 'react';
import eventService from '../services/eventService';

// Initial state
const initialState = {
  events: [],
  selectedEvent: null,
  loading: false,
  error: null
};

// Create context
const EventContext = createContext(initialState);

// Reducer function
const eventReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_EVENTS_REQUEST':
      return { ...state, loading: true, error: null };
    case 'FETCH_EVENTS_SUCCESS':
      return { ...state, loading: false, events: action.payload };
    case 'FETCH_EVENTS_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'FETCH_EVENT_REQUEST':
      return { ...state, loading: true, error: null };
    case 'FETCH_EVENT_SUCCESS':
      return { ...state, loading: false, selectedEvent: action.payload };
    case 'FETCH_EVENT_FAILURE':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

// Provider component
export const EventProvider = ({ children }) => {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  // Action to fetch all events
  const fetchEvents = async () => {
    dispatch({ type: 'FETCH_EVENTS_REQUEST' });
    try {
      const data = await eventService.getAllEvents();
      dispatch({ type: 'FETCH_EVENTS_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_EVENTS_FAILURE', 
        payload: error.message || 'Failed to fetch events' 
      });
    }
  };

  // Action to fetch a single event by ID
  const fetchEventById = async (eventId) => {
    dispatch({ type: 'FETCH_EVENT_REQUEST' });
    try {
      const data = await eventService.getEventById(eventId);
      dispatch({ type: 'FETCH_EVENT_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ 
        type: 'FETCH_EVENT_FAILURE', 
        payload: error.message || `Failed to fetch event with ID ${eventId}` 
      });
    }
  };

  return (
    <EventContext.Provider value={{ 
      ...state, 
      fetchEvents, 
      fetchEventById 
    }}>
      {children}
    </EventContext.Provider>
  );
};

// Custom hook for using the context
export const useEvents = () => useContext(EventContext);