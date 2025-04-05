import React, { createContext, useContext, useReducer, useCallback } from 'react';
import myTicketService from '../services/myTicketService';
// import { useAuth } from './AuthContext'; // adjust path as needed

const initialState = {
  transactions: [],
  loading: false,
  error: null
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
    default:
      return state;
  }
};

export const MyTicketProvider = ({ children }) => {
  const [state, dispatch] = useReducer(myTicketReducer, initialState);

  const fetchGroupedTickets = useCallback(async () => {
    dispatch({ type: 'FETCH_TICKETS_REQUEST' });
    try {
      // const { user } = useAuth();
      // const userID = user ? user.id : null;
      const userID = "user_013"; // Replace with actual user ID or fetch from auth context
      const rawTickets = await myTicketService.getMyTickets(userID);
      console.log('Raw tickets:', rawTickets);
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

      const enriched = await Promise.all(
        Object.values(grouped).map(async txn => {
          const event = await myTicketService.getEventDetails(txn.eventID);
          return {
            ...txn,
            eventTitle: event.EventResponse.Artist,
            eventDate: event.EventResponse.EventDate,
            eventTime: event.EventResponse.EventTime,
            numTickets: txn.ticketIDs.length
          };
        })
      );

      console.log('Final enriched transactions:', enriched);

      dispatch({ type: 'FETCH_TICKETS_SUCCESS', payload: enriched });
    } catch (error) {
      dispatch({
        type: 'FETCH_TICKETS_FAILURE',
        payload: error.message || 'Failed to fetch tickets'
      });
    }
  }, []);

  return (
    <MyTicketContext.Provider value={{ ...state, fetchGroupedTickets }}>
      {children}
    </MyTicketContext.Provider>
  );
};

export const useMyTickets = () => useContext(MyTicketContext);
