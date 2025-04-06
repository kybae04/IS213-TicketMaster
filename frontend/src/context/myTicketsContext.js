import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import myTicketService from '../services/myTicketService';
import { useAuth } from './AuthContext';

const initialState = {
  transactions: [],
  loading: false,
  error: null,
  cache: {
    events: {} // Cache for event details
  }
};

const MyTicketContext = createContext(initialState);

const myTicketReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_TICKETS_REQUEST':
      return { ...state, loading: true, error: null };
    case 'FETCH_TICKETS_SUCCESS':
      return { ...state, loading: false, transactions: action.payload };
    case 'FETCH_TICKETS_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'CACHE_EVENT':
      return { 
        ...state, 
        cache: { 
          ...state.cache, 
          events: { 
            ...state.cache.events, 
            [action.payload.id]: {
              data: action.payload.data,
              timestamp: Date.now()
            }
          } 
        }
      };
    case 'CLEAR_CACHE':
      return { ...state, cache: { events: {} } };
    default:
      return state;
  }
};

export const MyTicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(myTicketReducer, initialState);
  const { backendUserId, user, loading: authLoading } = useAuth();
  
  // Store the latest used backend user ID to detect changes
  const lastUsedUserIdRef = useRef(null);

  // For debugging
  const requestCount = useRef(0);

  // Debug logging for auth context values
  useEffect(() => {
    console.log('Auth context in MyTicketsContext:', { 
      backendUserId, 
      userEmail: user?.email,
      userID: user?.id,
      authLoading
    });
    
    // If backendUserId changes, re-fetch tickets
    if (backendUserId && backendUserId !== lastUsedUserIdRef.current) {
      console.log(`Backend user ID changed from ${lastUsedUserIdRef.current} to ${backendUserId}. Re-fetching tickets.`);
      lastUsedUserIdRef.current = backendUserId;
      fetchGroupedTickets();
    }
  }, [backendUserId, user, authLoading]);

  const fetchGroupedTickets = useCallback(async () => {
    // For debugging
    console.log('fetchGroupedTickets called', ++requestCount.current);
    console.log('Current backendUserId:', backendUserId);
    console.log('Current user:', user?.email, user?.id);
    
    // Update the last used user ID
    lastUsedUserIdRef.current = backendUserId;
    
    dispatch({ type: 'FETCH_TICKETS_REQUEST' });
    
    try {
      // Only proceed if we have a valid backend user ID
      if (!backendUserId) {
        throw new Error('No backend user ID found. Please ensure you are logged in with a valid account.');
      }
      
      console.log('Fetching tickets for user:', backendUserId);
      const rawTickets = await myTicketService.getMyTickets(backendUserId);
      console.log('Raw tickets received:', rawTickets);
      
      if (!rawTickets || !Array.isArray(rawTickets) || rawTickets.length === 0) {
        console.log('No tickets found or invalid response');
        dispatch({ type: 'FETCH_TICKETS_SUCCESS', payload: [] });
        return;
      }
      
      // Group tickets by transaction
      const grouped = {};
      rawTickets.forEach(ticket => {
        const txn = ticket.transactionID;
        if (!grouped[txn]) {
          grouped[txn] = {
            transactionID: txn,
            eventID: ticket.eventID,
            status: ticket.status,
            ticketIDs: [],
            seatIDs: []
          };
        }
        grouped[txn].ticketIDs.push(ticket.ticketID);
        grouped[txn].seatIDs.push(ticket.seatID);
      });

      console.log('Grouped transactions:', grouped);
      
      // Simplified approach - fetch event details sequentially
      const enriched = await Promise.all(
        Object.values(grouped).map(async txn => {
          try {
            console.log(`Fetching event ${txn.eventID} for transaction ${txn.transactionID}`);
            const event = await myTicketService.getEventDetails(txn.eventID);
            console.log(`Event data received for ${txn.eventID}:`, event);
            
            return {
              ...txn,
              eventTitle: event?.EventResponse?.Artist || 'Unknown Event',
              eventDate: event?.EventResponse?.EventDate || 'Unknown Date',
              eventTime: event?.EventResponse?.EventTime || 'Unknown Time',
              numTickets: txn.ticketIDs.length
            };
          } catch (error) {
            console.error(`Error fetching event ${txn.eventID}:`, error);
            return {
              ...txn,
              eventTitle: 'Unknown Event',
              eventDate: 'Unknown Date',
              eventTime: 'Unknown Time',
              numTickets: txn.ticketIDs.length
            };
          }
        })
      );

      console.log('Final enriched transactions:', enriched);
      
      dispatch({ type: 'FETCH_TICKETS_SUCCESS', payload: enriched });
    } catch (error) {
      console.error('Error in fetchGroupedTickets:', error);
      dispatch({
        type: 'FETCH_TICKETS_FAILURE',
        payload: error.message || 'Failed to fetch tickets'
      });
    }
  }, [backendUserId, user]);

  // For debugging - log state changes
  useEffect(() => {
    console.log('MyTicketContext state updated:', state);
  }, [state]);

  return (
    <MyTicketContext.Provider value={{ 
      ...state, 
      fetchGroupedTickets
    }}>
      {children}
    </MyTicketContext.Provider>
  );
};

export const useMyTickets = () => useContext(MyTicketContext);