import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import myTicketService from '../services/myTicketService';
import { useAuth } from './AuthContext';

const initialState = {
  transactions: [],
  loading: false,
  error: null,
  cache: {
    events: {} // Cache for event details
  },
  ticketDetails: {} // Store ticket details by transaction ID
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
    case 'FETCH_TICKET_DETAILS_REQUEST':
      return { 
        ...state, 
        ticketDetails: { 
          ...state.ticketDetails,
          [action.payload]: { 
            loading: true, 
            data: state.ticketDetails[action.payload]?.data || null, 
            error: null 
          } 
        } 
      };
    case 'FETCH_TICKET_DETAILS_SUCCESS':
      return { 
        ...state, 
        ticketDetails: { 
          ...state.ticketDetails,
          [action.payload.transactionId]: { 
            loading: false, 
            data: action.payload.data, 
            error: null 
          } 
        } 
      };
    case 'FETCH_TICKET_DETAILS_FAILURE':
      return { 
        ...state, 
        ticketDetails: { 
          ...state.ticketDetails,
          [action.payload.transactionId]: { 
            loading: false, 
            data: null, 
            error: action.payload.error 
          } 
        } 
      };
    case 'UPDATE_TICKET_TRADABILITY':
      if (!state.ticketDetails[action.payload.transactionId] || 
          !state.ticketDetails[action.payload.transactionId].data) {
        return state;
      }
      return {
        ...state,
        ticketDetails: {
          ...state.ticketDetails,
          [action.payload.transactionId]: {
            ...state.ticketDetails[action.payload.transactionId],
            data: state.ticketDetails[action.payload.transactionId].data.map(ticket => 
              ticket.ticketID === action.payload.ticketId 
                ? { ...ticket, tradability: action.payload.tradability }
                : ticket
            )
          }
        }
      };
    default:
      return state;
  }
};

export const MyTicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(myTicketReducer, initialState);
  const { backendUserId, user, loading: authLoading } = useAuth();
  
  // Store the latest used backend user ID to detect changes
  const lastUsedUserIdRef = useRef(null);
  
  // Track ongoing fetch operations to prevent duplicates
  const pendingFetchesRef = useRef({});
  
  // Flag to track if initial fetch has been done
  const initialFetchDoneRef = useRef(false);

  // Function to fetch and group tickets
  const fetchGroupedTickets = useCallback(async () => {
    // Skip if we don't have a user ID yet or auth is still loading
    if (!backendUserId || authLoading) {
      console.log('Skipping ticket fetch - no user ID or auth still loading');
      return;
    }
    
    // Skip if we already have a fetch in progress for this user
    if (pendingFetchesRef.current.groupedTickets) {
      console.log('Skipping duplicate grouped tickets fetch');
      return;
    }
    
    // Set the pending flag
    pendingFetchesRef.current.groupedTickets = true;
    
    // Update the last used user ID
    lastUsedUserIdRef.current = backendUserId;
    
    dispatch({ type: 'FETCH_TICKETS_REQUEST' });
    
    try {
      console.log('Fetching tickets for user:', backendUserId);
      const rawTickets = await myTicketService.getMyTickets(backendUserId);
      
      if (!rawTickets || !Array.isArray(rawTickets) || rawTickets.length === 0) {
        console.log('No tickets found or invalid response');
        dispatch({ type: 'FETCH_TICKETS_SUCCESS', payload: [] });
        pendingFetchesRef.current.groupedTickets = false;
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
      
      // Fetch event details for each transaction
      const enriched = await Promise.all(
        Object.values(grouped).map(async txn => {
          try {
            const event = await myTicketService.getEventDetails(txn.eventID);
            
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
      
      dispatch({ type: 'FETCH_TICKETS_SUCCESS', payload: enriched });
    } catch (error) {
      console.error('Error in fetchGroupedTickets:', error);
      dispatch({
        type: 'FETCH_TICKETS_FAILURE',
        payload: error.message || 'Failed to fetch tickets'
      });
    } finally {
      // Clear the pending flag
      pendingFetchesRef.current.groupedTickets = false;
      // Mark initial fetch as done
      initialFetchDoneRef.current = true;
    }
  }, [backendUserId, authLoading]);

  // Fetch detailed tickets for a transaction
  const fetchTicketDetails = useCallback(async (transactionID) => {
    // Skip if we don't have a valid transaction ID
    if (!transactionID) {
      console.log('Invalid transaction ID for ticket details');
      return;
    }
    
    // If we already have the data and it's not loading, don't fetch again
    if (state.ticketDetails[transactionID] && 
        !state.ticketDetails[transactionID].loading && 
        state.ticketDetails[transactionID].data) {
      console.log(`Already have data for transaction ${transactionID}, skipping fetch`);
      return;
    }
    
    // Skip if already fetching this transaction
    if (pendingFetchesRef.current[`ticketDetails_${transactionID}`]) {
      console.log(`Already fetching details for transaction ${transactionID}, skipping duplicate request`);
      return;
    }
    
    // Mark this transaction as being fetched
    pendingFetchesRef.current[`ticketDetails_${transactionID}`] = true;
    
    // Set loading state in the store
    dispatch({ type: 'FETCH_TICKET_DETAILS_REQUEST', payload: transactionID });
    
    try {
      console.log(`Fetching ticket details for transaction ${transactionID}`);
      const tickets = await myTicketService.getTicketsByTransaction(transactionID);
      
      // Find the transaction to get event details
      const transaction = state.transactions.find(t => t.transactionID === transactionID);
      
      if (transaction) {
        // Enrich tickets with event information
        const enrichedTickets = tickets.map(ticket => ({
          ...ticket,
          eventTitle: transaction.eventTitle,
          eventDate: transaction.eventDate,
          eventTime: transaction.eventTime
        }));
        
        // Store the enriched tickets
        dispatch({ 
          type: 'FETCH_TICKET_DETAILS_SUCCESS', 
          payload: { transactionId: transactionID, data: enrichedTickets } 
        });
        
        // Now check tradability for each ticket (async)
        enrichedTickets.forEach(async (ticket) => {
          try {
            const tradability = await myTicketService.verifyTicketTradable(ticket.ticketID);
            dispatch({
              type: 'UPDATE_TICKET_TRADABILITY',
              payload: {
                transactionId: transactionID,
                ticketId: ticket.ticketID,
                tradability
              }
            });
          } catch (error) {
            console.error(`Error verifying tradability for ticket ${ticket.ticketID}:`, error);
            // Update with error state
            dispatch({
              type: 'UPDATE_TICKET_TRADABILITY',
              payload: {
                transactionId: transactionID,
                ticketId: ticket.ticketID,
                tradability: { tradable: false, reason: "Error verifying tradability" }
              }
            });
          }
        });
      } else {
        throw new Error(`Transaction ${transactionID} not found in state`);
      }
    } catch (error) {
      console.error(`Error fetching tickets for transaction ${transactionID}:`, error);
      dispatch({
        type: 'FETCH_TICKET_DETAILS_FAILURE',
        payload: {
          transactionId: transactionID,
          error: error.message || `Failed to fetch tickets for transaction ${transactionID}`
        }
      });
    } finally {
      // Clear the pending flag
      pendingFetchesRef.current[`ticketDetails_${transactionID}`] = false;
    }
  }, [state.transactions]);

  // Fetch tickets once when the component mounts or when the user changes
  useEffect(() => {
    // Only fetch if we have a user ID and it has changed, or if we haven't done the initial fetch
    const shouldFetch = 
      (backendUserId && backendUserId !== lastUsedUserIdRef.current) || 
      (backendUserId && !initialFetchDoneRef.current);
    
    if (shouldFetch && !authLoading) {
      fetchGroupedTickets();
    }
  }, [backendUserId, authLoading, fetchGroupedTickets]);

  return (
    <MyTicketContext.Provider
      value={{
        ...state,
        fetchGroupedTickets,
        fetchTicketDetails
      }}
    >
      {children}
    </MyTicketContext.Provider>
  );
};

export const useMyTickets = () => useContext(MyTicketContext);