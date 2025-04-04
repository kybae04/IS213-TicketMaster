import React, { createContext, useContext, useReducer, useCallback } from 'react';
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
  console.log('EventContext: Action received:', action.type, action.payload);
  
  switch (action.type) {
    case 'FETCH_EVENTS_REQUEST':
      console.log('EventContext: FETCH_EVENTS_REQUEST - Setting loading to true');
      return { ...state, loading: true, error: null };
    case 'FETCH_EVENTS_SUCCESS':
      console.log('EventContext: FETCH_EVENTS_SUCCESS - Got events:', action.payload);
      console.log('EventContext: Number of events:', Array.isArray(action.payload) ? action.payload.length : 'not an array');
      return { ...state, loading: false, events: action.payload };
    case 'FETCH_EVENTS_FAILURE':
      console.log('EventContext: FETCH_EVENTS_FAILURE - Error:', action.payload);
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

  // Use useCallback to prevent recreation of this function on each render
  const fetchEvents = useCallback(async () => {
    console.log('EventContext: fetchEvents called');
    dispatch({ type: 'FETCH_EVENTS_REQUEST' });
    try {
      console.log('EventContext: Calling eventService.getAllEvents()');
      const data = await eventService.getAllEvents();
      
      console.log('EventContext: Raw API response:', data);
      console.log('EventContext: Is data valid?', data && Array.isArray(data) && data.length > 0);
      
      if (!data || !Array.isArray(data)) {
        throw new Error('API did not return an array of events');
      }
      
      if (data.length === 0) {
        console.warn('EventContext: API returned an empty array of events');
      }
      
      // Check if any event is missing important data
      const missingData = data.filter(event => !event.title || !event.id);
      if (missingData.length > 0) {
        console.warn('EventContext: Some events are missing important data:', missingData);
      }
      
      dispatch({ type: 'FETCH_EVENTS_SUCCESS', payload: data });
    } catch (error) {
      console.error('EventContext: Error in fetchEvents:', error);
      dispatch({ 
        type: 'FETCH_EVENTS_FAILURE', 
        payload: error.message || 'Failed to fetch events' 
      });
    }
  }, []);

  // Use useCallback to prevent recreation of this function on each render
  const fetchEventById = useCallback(async (eventId) => {
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
  }, []);

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