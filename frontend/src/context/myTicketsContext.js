// import React, { createContext, useContext, useReducer, useCallback } from 'react';
// import myTicketService from '../services/myTicketService';
// // import { useAuth } from './AuthContext'; // adjust path as needed

// const initialState = {
//   transactions: [],
//   loading: false,
//   error: null
// };

// const MyTicketContext = createContext(initialState);

// const myTicketReducer = (state, action) => {
//   switch (action.type) {
//     case 'FETCH_TICKETS_REQUEST':
//       return { ...state, loading: true, error: null };
//     case 'FETCH_TICKETS_SUCCESS':
//       return { ...state, loading: false, transactions: action.payload };
//     case 'FETCH_TICKETS_FAILURE':
//       return { ...state, loading: false, error: action.payload };
//     default:
//       return state;
//   }
// };

// export const MyTicketProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(myTicketReducer, initialState);

//   const fetchGroupedTickets = useCallback(async () => {
//     dispatch({ type: 'FETCH_TICKETS_REQUEST' });
//     try {
//       // const { user } = useAuth();
//       // const userID = user ? user.id : null;
//       const userID = "user_013"; // Replace with actual user ID or fetch from auth context
//       const rawTickets = await myTicketService.getMyTickets(userID);
//       console.log('Raw tickets:', rawTickets);
//       const grouped = {};

//       rawTickets.forEach(ticket => {
//         const txn = ticket.transactionID;
//         if (!grouped[txn]) {
//           grouped[txn] = {
//             transactionID: txn,
//             eventID: ticket.eventID,
//             status: ticket.status,
//             ticketIDs: [],
//             seatIDs: []
//           };
//         }
//         grouped[txn].ticketIDs.push(ticket.ticketID);
//         grouped[txn].seatIDs.push(ticket.seatID);
//       });

//       console.log('Grouped transactions:', grouped);

//       const enriched = await Promise.all(
//         Object.values(grouped).map(async txn => {
//           const event = await myTicketService.getEventDetails(txn.eventID);
//           return {
//             ...txn,
//             eventTitle: event.EventResponse.Artist,
//             eventDate: event.EventResponse.EventDate,
//             eventTime: event.EventResponse.EventTime,
//             numTickets: txn.ticketIDs.length
//           };
//         })
//       );

//       console.log('Final enriched transactions:', enriched);

//       dispatch({ type: 'FETCH_TICKETS_SUCCESS', payload: enriched });
//     } catch (error) {
//       dispatch({
//         type: 'FETCH_TICKETS_FAILURE',
//         payload: error.message || 'Failed to fetch tickets'
//       });
//     }
//   }, []);

//   return (
//     <MyTicketContext.Provider value={{ ...state, fetchGroupedTickets }}>
//       {children}
//     </MyTicketContext.Provider>
//   );
// };

// export const useMyTickets = () => useContext(MyTicketContext);


import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import myTicketService from '../services/myTicketService';
// import { useAuth } from './AuthContext';

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
  // const { backendUserId, loading: authLoading } = useAuth();

  // For debugging
  const requestCount = useRef(0);

  const fetchGroupedTickets = useCallback(async () => {
    if (!backendUserId) {
      console.warn('No backend user ID found, cannot fetch tickets');
      return;
    }
    // For debugging
    console.log('fetchGroupedTickets called', ++requestCount.current);
    
    dispatch({ type: 'FETCH_TICKETS_REQUEST' });
    
    try {
      const backendUserId = "user_122"; // Replace with actual user ID

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
  }, []);

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