import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import myTicketService from '../services/myTicketService';
import tradeService from '../services/tradeService';
import { useAuth } from '../context/AuthContext';
import { parseSeatDetails, getCategoryColor, getCategoryName, getCategoryColorHex } from '../utils/seatUtils';
import { artistImageMap, getEventImage } from '../utils/imageUtils';

const TradingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUserId } = useAuth();
  const [userTickets, setUserTickets] = useState([]);
  const [ticketTransactions, setTicketTransactions] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null); // Track which specific seat is selected
  const [availableTickets, setAvailableTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [ticketToTrade, setTicketToTrade] = useState(null);
  const [notification, setNotification] = useState(null);
  const [tradeRequests, setTradeRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const availableTicketsRef = useRef(null);
  const tradeRequestsRef = useRef(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const notificationTimerRef = useRef(null);
  const [dataReady, setDataReady] = useState(false); // Add flag to control rendering
  
  // Custom confirmation modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

  // Fetch available tickets for trade
  const fetchAvailableTicketsForTrade = useCallback(async (ticket, seatID) => {
    if (!ticket || !seatID) return;
    
    // Skip trading options for cancelled/voided tickets
    if (ticket.status === 'voided' || ticket.status === 'cancelled') {
      console.log('Skipping trade options for cancelled/voided ticket:', ticket.ticketID);
      return;
    }
    
    setIsLoadingTrades(true);
    setAvailableTickets([]); // Clear previous results
    
    try {
      // Parse the seat details to get the category
      const seatDetails = parseSeatDetails(seatID);
      if (!seatDetails) {
        console.error('Failed to parse seat details');
        setIsLoadingTrades(false);
        return;
      }
      
      console.log('Looking for trades with:', {
        eventID: ticket.eventID,
        category: seatDetails.category,
        userID: backendUserId
      });
      
      // Call the API to get tradeable tickets with the same event and category
      const tradableTickets = await myTicketService.getTradeableTickets(
        ticket.eventID,
        seatDetails.category
      );
      
      console.log('Raw tradable tickets returned:', tradableTickets);
      
      // Immediately filter out tickets that aren't valid for trading
      const filteredTickets = tradableTickets.filter(tradeTicket => 
        // Different user
        tradeTicket.userID !== backendUserId && 
        // Listed for trade
        tradeTicket.listed_for_trade === true &&
        // Not cancelled or voided
        tradeTicket.status !== 'voided' &&
        tradeTicket.status !== 'cancelled'
      );
      
      console.log(`Found ${filteredTickets.length} active tickets available for trade after filtering`);
      
      // DIAGNOSTIC: If no tradable tickets found, check all tickets in the event
      if (filteredTickets.length === 0) {
        console.log('No trades found via normal method - running diagnostic check');
        try {
          // Get all tickets for this event
          const allEventTickets = await myTicketService.getAllTicketsForEvent(ticket.eventID);
          console.log(`Found ${allEventTickets.length} total tickets for event ${ticket.eventID}`);
          
          // Check how many are actually listed for trade
          const listedForTrade = allEventTickets.filter(t => t.listed_for_trade === true);
          console.log(`${listedForTrade.length} tickets are listed for trade`);
          
          // Check how many are in the same category
          const sameCategory = listedForTrade.filter(t => {
            const details = parseSeatDetails(t.seatID);
            return details && details.category === seatDetails.category;
          });
          console.log(`${sameCategory.length} tickets match category ${seatDetails.category}`);
          
          // Check how many are from other users
          const fromOtherUsers = sameCategory.filter(t => t.userID !== backendUserId);
          console.log(`${fromOtherUsers.length} tickets are from other users`);
          
          // If we found valid tickets that weren't returned by the API, use them
          if (fromOtherUsers.length > 0) {
            console.log('Found valid tradable tickets via diagnostic check!');
            
            // If no event details are available, get them from the user's ticket
            const eventDetails = {
              eventTitle: ticket.eventTitle,
              eventDate: ticket.eventDate,
              eventTime: ticket.eventTime,
              eventID: ticket.eventID
            };
            
            // Enrich tickets with event information
            const enrichedTickets = fromOtherUsers.map(tradeTicket => ({
              ...tradeTicket,
              eventTitle: eventDetails.eventTitle,
              eventDate: eventDetails.eventDate,
              eventTime: eventDetails.eventTime,
              eventID: eventDetails.eventID
            }));
            
            // Set the available tickets state with these diagnostic results
            setAvailableTickets(enrichedTickets);
            
            // Exit early - we've found tickets via diagnostic method
            if (availableTicketsRef.current) {
              setTimeout(() => {
                availableTicketsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 100);
            }
            setIsLoadingTrades(false);
            return;
          }
        } catch (diagError) {
          console.error('Diagnostic check failed:', diagError);
        }
      }
      
      // If no event details are available, get them from the user's ticket
      const eventDetails = {
        eventTitle: ticket.eventTitle,
        eventDate: ticket.eventDate,
        eventTime: ticket.eventTime,
        eventID: ticket.eventID
      };
      
      if (filteredTickets.length > 0) {
        // Enrich tickets with event information
        const enrichedTickets = filteredTickets.map(tradeTicket => ({
          ...tradeTicket,
          eventTitle: eventDetails.eventTitle,
          eventDate: eventDetails.eventDate,
          eventTime: eventDetails.eventTime,
          eventID: eventDetails.eventID
        }));
        
        console.log('Enriched tradable tickets:', enrichedTickets);
        
        // Set the available tickets state
        setAvailableTickets(enrichedTickets);
      } else {
        console.log('No tradable tickets found for this event and category');
        setAvailableTickets([]);
      }
      
      // Scroll to available tickets section after they're loaded
      if (availableTicketsRef.current) {
        setTimeout(() => {
          availableTicketsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching tradeable tickets:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load available tickets for trade'
      });
      setAvailableTickets([]);
    } finally {
      setIsLoadingTrades(false);
    }
  }, [backendUserId]);

  // Handle notification timeout
  useEffect(() => {
    if (notification) {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      
      notificationTimerRef.current = setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
    
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, [notification]);

  // Extract the fetchUserTickets function to be reusable
  const fetchUserTickets = useCallback(async () => {
    if (!backendUserId) return;
    
    setIsLoading(true);
    setDataReady(false); // Ensure we don't render until all data is ready
    setUserTickets([]); // Reset user tickets
    
    try {
      console.log('Fetching active tickets for user:', backendUserId);
      
      // Step 1: Fetch all transactions for the user
      const allTransactions = await myTicketService.getMyTickets(backendUserId);
      
      // Step 2: Immediately filter out any voided or cancelled transactions
      const activeTransactions = allTransactions.filter(txn => 
        txn.status !== 'voided' && txn.status !== 'cancelled'
      );
      
      console.log(`Found ${activeTransactions.length} active transactions out of ${allTransactions.length} total`);
      
      if (activeTransactions.length === 0) {
        // No active transactions found, set empty state and exit early
        setTicketTransactions([]);
        setUserTickets([]);
        setDataReady(true);
        setIsLoading(false);
        return;
      }
      
      // Store active transaction data for reference
      setTicketTransactions(activeTransactions);
      
      // Step 3: Get accurate event details for all transactions
      const transactionsWithEvents = [];
      for (const txn of activeTransactions) {
        try {
          // Try to get complete event details to replace any placeholders
          if (txn.eventID) {
            const eventResponse = await myTicketService.getEventDetails(txn.eventID);
            if (eventResponse && eventResponse.EventResponse) {
              // Update transaction with accurate event details if available
              transactionsWithEvents.push({
                ...txn,
                eventTitle: eventResponse.EventResponse.Artist || txn.eventTitle,
                eventDate: eventResponse.EventResponse.EventDate || txn.eventDate,
                eventTime: eventResponse.EventResponse.EventTime || txn.eventTime
              });
              continue;
            }
          }
          // If event details couldn't be fetched, use original values
          transactionsWithEvents.push(txn);
        } catch (err) {
          console.error(`Error fetching event details for transaction ${txn.transactionID}:`, err);
          transactionsWithEvents.push(txn);
        }
      }
      
      // Step 4: Fetch tickets for active transactions in parallel for better performance
      const ticketPromises = transactionsWithEvents.map(txn => 
        myTicketService.getTicketsByTransaction(txn.transactionID)
          .then(tickets => {
            // Attach transaction data to each ticket response
            return { 
              txn, 
              tickets: tickets || [] 
            };
          })
          .catch(err => {
            console.error(`Error fetching tickets for transaction ${txn.transactionID}:`, err);
            return { txn, tickets: [] };
          })
      );
      
      // Wait for all ticket data to be fetched
      const ticketResults = await Promise.all(ticketPromises);
      
      // Step 5: Process results and create enhanced ticket objects
      const allTicketsWithDetails = [];
      
      for (const { txn, tickets } of ticketResults) {
        if (!tickets || tickets.length === 0) continue;
        
        // Make sure event info is valid - avoid using placeholder values
        const eventInfo = {
          eventTitle: txn.eventTitle && txn.eventTitle !== 'Unknown Event' ? txn.eventTitle : "Taylor Swift",
          eventDate: txn.eventDate && txn.eventDate !== 'Unknown Date' ? txn.eventDate : "2023-12-31",
          eventTime: txn.eventTime && txn.eventTime !== 'Unknown Time' ? txn.eventTime : '8:00 PM',
          eventID: txn.eventID
        };
        
        // Create enhanced ticket objects with all necessary data
        const enhancedTickets = tickets
          // Only include tickets owned by this user
          .filter(ticket => ticket.userID === backendUserId)
          .map(ticket => ({
            ...ticket,
            eventTitle: eventInfo.eventTitle,
            eventDate: eventInfo.eventDate,
            eventTime: eventInfo.eventTime,
            eventID: eventInfo.eventID,
            tradability: { ticket_id: ticket.ticketID, tradable: true },
            transactionID: txn.transactionID,
            status: txn.status
          }));
        
        allTicketsWithDetails.push(...enhancedTickets);
      }
      
      // Step 6: Filter out tickets with invalid or missing seat IDs
      // Less restrictive - just check that seatID exists
      const validTickets = allTicketsWithDetails.filter(ticket => 
        ticket.seatID && ticket.seatID.length > 0
      );
      
      // Step 7: Remove duplicate tickets by keeping only one instance of each seatID
      const uniqueTickets = Array.from(
        validTickets.reduce((map, ticket) => {
          if (!map.has(ticket.seatID)) {
            map.set(ticket.seatID, ticket);
          }
          return map;
        }, new Map()).values()
      );
      
      console.log(`Found ${uniqueTickets.length} unique active tickets for trading`);
      
      if (uniqueTickets.length === 0) {
        // No valid tickets found
        setUserTickets([]);
        setDataReady(true);
        setIsLoading(false);
        return;
      }
      
      // Step 8: Set state only after all processing is complete
      setUserTickets(uniqueTickets);
      
      // Update the transaction groups with correct event details
      const updatedGroups = uniqueTickets.reduce((acc, ticket) => {
        const txnId = ticket.transactionID;
        
        if (!acc[txnId]) {
          acc[txnId] = {
            transactionID: txnId,
            eventTitle: ticket.eventTitle,
            eventDate: ticket.eventDate,
            eventTime: ticket.eventTime,
            eventID: ticket.eventID,
            tickets: [],
            numTickets: 0
          };
        }
        
        acc[txnId].tickets.push(ticket);
        acc[txnId].numTickets += 1;
        
        return acc;
      }, {});
      
      // Pre-select a ticket if passed via location state
      if (location.state?.ticket) {
        const preSelectedTicket = location.state.ticket;
        const matchedTicket = uniqueTickets.find(t => t.ticketID === preSelectedTicket.ticketID);
        if (matchedTicket) {
          setSelectedTicket(matchedTicket);
          setSelectedSeat(matchedTicket.seatID);
          fetchAvailableTicketsForTrade(matchedTicket, matchedTicket.seatID);
        }
      }
      
      // Set data ready flag to true only when all data is processed
      setDataReady(true);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load your tickets'
      });
      setUserTickets([]); // Set empty tickets on error
      setDataReady(true); // Still set to true to show error state
    } finally {
      setIsLoading(false);
    }
  }, [backendUserId, location.state, fetchAvailableTicketsForTrade]);

  // Update useEffect to use the new fetchUserTickets function
  useEffect(() => {
    fetchUserTickets();
  }, [fetchUserTickets]);

  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedSeat(ticket.seatID);
    fetchAvailableTicketsForTrade(ticket, ticket.seatID);
  };

  const handleSeatSelect = (seat) => {
    setSelectedSeat(seat);
    fetchAvailableTicketsForTrade(selectedTicket, seat);
  };

  const handleTradeClick = (tradeTicket) => {
    setTicketToTrade(tradeTicket);
    setShowTradeModal(true);
  };

  // Handle show ticket details in modal
  const handleShowDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const confirmTrade = async () => {
    try {
      const requestData = {
        ticketID: selectedTicket.ticketID, 
        requesterID: backendUserId,
        requestedTicketID: ticketToTrade.ticketID,
        requestedUserID: ticketToTrade.userID
      };
      
      console.log('Creating trade request with data:', requestData);
      
      // Make the API call to create a trade request
      await tradeService.createTradeRequest(requestData);
      
      // Close the modal
      setShowTradeModal(false);
      
      // Show success notification
      setNotification({
        type: 'success',
        message: 'Trade request sent successfully'
      });
      
      // Refresh trade requests
      fetchPendingTradeRequests();
      
      // Scroll to trade requests section if it exists
      if (tradeRequestsRef.current) {
        setTimeout(() => {
          tradeRequestsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    } catch (error) {
      console.error('Error sending trade request:', error);
      
      setNotification({
        type: 'error',
        message: 'Failed to send trade request'
      });
    }
  };

  // Add a function to toggle the trade listing status
  const toggleTradeStatus = async (ticket, e) => {
    e.stopPropagation(); // Prevent selecting the ticket when clicking the toggle button
    
    // First, update the local state immediately for better UX
    const newStatus = !ticket.listed_for_trade;
    setUserTickets(prev => prev.map(t => 
      t.ticketID === ticket.ticketID ? { ...t, listed_for_trade: newStatus } : t
    ));
    
    // Clear any existing notification first
    setNotification(null);
    
    // Show notification after a small delay to ensure animation works properly
    setTimeout(() => {
      setNotification({
        type: 'success',
        message: newStatus 
          ? 'Ticket listed for trade' 
          : 'Ticket removed from trade listing'
      });
    }, 10);
    
    try {
      // Then perform the API call (async)
      await myTicketService.toggleTradeStatus(ticket.ticketID, ticket.listed_for_trade);
    } catch (error) {
      console.error('Error toggling trade status:', error);
      
      // Revert the local state in case of error
      setUserTickets(prev => prev.map(t => 
        t.ticketID === ticket.ticketID ? { ...t, listed_for_trade: ticket.listed_for_trade } : t
      ));
      
      // Small delay to ensure animation works properly 
      setTimeout(() => {
        // Show error notification
        setNotification({
          type: 'error',
          message: 'Failed to update trade status'
        });
      }, 10);
    }
  };

  // Group tickets by transaction and count
  const groupedTransactions = userTickets.reduce((acc, ticket) => {
    const txnId = ticket.transactionID;
    
    if (!acc[txnId]) {
      acc[txnId] = {
        transactionID: txnId,
        eventTitle: ticket.eventTitle,
        eventDate: ticket.eventDate,
        eventTime: ticket.eventTime,
        eventID: ticket.eventID,
        tickets: [],
        numTickets: 0
      };
    }
    
    acc[txnId].tickets.push(ticket);
    acc[txnId].numTickets += 1;
    
    return acc;
  }, {});
  
  // Convert to array for rendering
  const transactionGroups = Object.values(groupedTransactions);

  // Fetch pending trade requests
  const fetchPendingTradeRequests = useCallback(async () => {
    if (!backendUserId) return;
    
    setIsLoadingRequests(true);
    
    try {
      const requests = await tradeService.getPendingTradeRequests(backendUserId);
      console.log('Fetched trade requests:', requests);
      
      // Enhance trade requests with ticket details
      const enhancedRequests = [];
      
      for (const request of requests) {
        try {
          // Get both tickets' details
          const [ticketDetails, requestedTicketDetails] = await Promise.all([
            tradeService.getTicketDetails(request.ticketID),
            tradeService.getTicketDetails(request.requestedTicketID)
          ]);
          
          // Extract event IDs from seat IDs
          const ticketSeatDetails = parseSeatDetails(ticketDetails.seatID);
          const requestedTicketSeatDetails = parseSeatDetails(requestedTicketDetails.seatID);
          
          // Fetch event details for both tickets
          let ticketEventDetails = null;
          let requestedTicketEventDetails = null;
          
          if (ticketSeatDetails?.event) {
            try {
              ticketEventDetails = await myTicketService.getEventByEventId(ticketSeatDetails.event);
            } catch (error) {
              console.error(`Error fetching event details for event ID ${ticketSeatDetails.event}:`, error);
            }
          }
          
          if (requestedTicketSeatDetails?.event) {
            try {
              requestedTicketEventDetails = await myTicketService.getEventByEventId(requestedTicketSeatDetails.event);
            } catch (error) {
              console.error(`Error fetching event details for event ID ${requestedTicketSeatDetails.event}:`, error);
            }
          }
          
          // Enhance the request with ticket details and event details
          enhancedRequests.push({
            ...request,
            ticketDetails: {
              ...ticketDetails,
              seatDetails: ticketSeatDetails,
              categoryName: getCategoryName(ticketSeatDetails?.category),
              event_name: ticketEventDetails?.EventResponse?.Artist || "Unknown Event",
              event_date: ticketEventDetails?.EventResponse?.EventDate || "Unknown Date",
              event_time: ticketEventDetails?.EventResponse?.EventTime || "Unknown Time"
            },
            requestedTicketDetails: {
              ...requestedTicketDetails,
              seatDetails: requestedTicketSeatDetails,
              categoryName: getCategoryName(requestedTicketSeatDetails?.category),
              event_name: requestedTicketEventDetails?.EventResponse?.Artist || "Unknown Event",
              event_date: requestedTicketEventDetails?.EventResponse?.EventDate || "Unknown Date",
              event_time: requestedTicketEventDetails?.EventResponse?.EventTime || "Unknown Time"
            }
          });
        } catch (error) {
          console.error(`Error fetching details for request ${request.tradeRequestID}:`, error);
          // Add request with minimal details if we couldn't get full details
          enhancedRequests.push(request);
        }
      }
      
      // Store all requests
      setTradeRequests(enhancedRequests);
      
      // Separate incoming and outgoing requests
      const incoming = enhancedRequests.filter(req => 
        req.requestedUserID === backendUserId && req.status === 'pending'
      );
      
      const outgoing = enhancedRequests.filter(req => 
        req.requesterID === backendUserId && req.status === 'pending'
      );
      
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      
      console.log(`Found ${incoming.length} incoming and ${outgoing.length} outgoing requests`);
    } catch (error) {
      console.error('Error fetching trade requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [backendUserId]);

  // Fetch trade requests when the component loads
  useEffect(() => {
    if (backendUserId) {
      fetchPendingTradeRequests();
    }
  }, [backendUserId, fetchPendingTradeRequests]);

  // Handle accepting a trade request
  const handleAcceptTradeRequest = useCallback(async (tradeRequestId) => {
    try {
      setIsLoadingRequests(true);
      await tradeService.acceptTradeRequest(tradeRequestId, backendUserId);
      
      // Close the modal
      setShowAcceptModal(false);
      setSelectedRequestId(null);
      setSelectedRequestDetails(null);
      
      // Show success notification
      setNotification({
        type: 'success',
        message: 'Trade request accepted successfully! Tickets have been swapped.'
      });
      
      // Refresh trade requests and tickets
      await fetchPendingTradeRequests();
      await fetchUserTickets();
      
    } catch (error) {
      console.error('Error accepting trade request:', error);
      setNotification({
        type: 'error',
        message: 'Failed to accept trade request. Please try again later.'
      });
    } finally {
      setIsLoadingRequests(false);
    }
  }, [backendUserId, fetchPendingTradeRequests, fetchUserTickets]);

  // Handle declining a trade request
  const handleDeclineTradeRequest = useCallback(async (tradeRequestId) => {
    try {
      setIsLoadingRequests(true);
      await tradeService.cancelTradeRequest(tradeRequestId, backendUserId);
      
      // Close the modal
      setShowDeclineModal(false);
      setSelectedRequestId(null);
      setSelectedRequestDetails(null);
      
      // Show success notification
      setNotification({
        type: 'success',
        message: 'Trade request declined successfully.'
      });
      
      // Refresh trade requests
      await fetchPendingTradeRequests();
      
    } catch (error) {
      console.error('Error declining trade request:', error);
      setNotification({
        type: 'error',
        message: 'Failed to decline trade request. Please try again later.'
      });
    } finally {
      setIsLoadingRequests(false);
    }
  }, [backendUserId, fetchPendingTradeRequests]);

  // Handle cancelling a trade request
  const handleCancelTradeRequest = useCallback(async (tradeRequestId) => {
    try {
      setIsLoadingRequests(true);
      await tradeService.cancelTradeRequest(tradeRequestId, backendUserId);
      
      // Close the modal
      setShowCancelModal(false);
      setSelectedRequestId(null);
      setSelectedRequestDetails(null);
      
      // Show success notification
      setNotification({
        type: 'success',
        message: 'Trade request cancelled successfully.'
      });
      
      // Refresh trade requests
      await fetchPendingTradeRequests();
      
    } catch (error) {
      console.error('Error cancelling trade request:', error);
      setNotification({
        type: 'error',
        message: 'Failed to cancel trade request. Please try again later.'
      });
    } finally {
      setIsLoadingRequests(false);
    }
  }, [backendUserId, fetchPendingTradeRequests]);

  // Function to open accept confirmation modal
  const openAcceptConfirmation = (request) => {
    setSelectedRequestId(request.tradeRequestID);
    setSelectedRequestDetails(request);
    setShowAcceptModal(true);
  };

  // Function to open decline confirmation modal
  const openDeclineConfirmation = (request) => {
    setSelectedRequestId(request.tradeRequestID);
    setSelectedRequestDetails(request);
    setShowDeclineModal(true);
  };

  // Function to open cancel confirmation modal
  const openCancelConfirmation = (request) => {
    setSelectedRequestId(request.tradeRequestID);
    setSelectedRequestDetails(request);
    setShowCancelModal(true);
  };

  // Helper function to find ticket details by ticketID
  const getTicketDetailsById = useCallback((ticketId, requestData) => {
    // Check if this is a requester ticket or requested ticket and return the enhanced details
    if (requestData) {
      if (requestData.ticketID === ticketId && requestData.ticketDetails) {
        return {
          eventTitle: requestData.ticketDetails.event_name || "Unknown Event",
          eventDate: requestData.ticketDetails.event_date || "Unknown Date",
          section: requestData.ticketDetails.seatDetails?.section || "Unknown",
          seat: requestData.ticketDetails.seatDetails?.seat || "Unknown",
          category: requestData.ticketDetails.categoryName || "Unknown",
          seatDetails: requestData.ticketDetails.seatDetails
        };
      }
      
      if (requestData.requestedTicketID === ticketId && requestData.requestedTicketDetails) {
        return {
          eventTitle: requestData.requestedTicketDetails.event_name || "Unknown Event",
          eventDate: requestData.requestedTicketDetails.event_date || "Unknown Date",
          section: requestData.requestedTicketDetails.seatDetails?.section || "Unknown",
          seat: requestData.requestedTicketDetails.seatDetails?.seat || "Unknown",
          category: requestData.requestedTicketDetails.categoryName || "Unknown",
          seatDetails: requestData.requestedTicketDetails.seatDetails
        };
      }
    }
    
    // Fallback to looking in userTickets array
    const ticket = userTickets.find(t => t.ticketID === ticketId);
    
    if (ticket) {
      const seatDetails = parseSeatDetails(ticket.seatID);
      return {
        eventTitle: ticket.eventTitle,
        eventDate: ticket.eventDate,
        section: seatDetails?.section || 'Unknown',
        seat: seatDetails?.seat || 'Unknown',
        category: getCategoryName(seatDetails?.category),
        seatDetails: seatDetails
      };
    }
    
    return {
      eventTitle: "Unknown Event",
      eventDate: "Unknown Date",
      section: "Unknown",
      seat: "Unknown",
      category: "Unknown",
      seatDetails: null
    };
  }, [userTickets]);

  // Show a loading state while data is being prepared
  if (isLoading || !dataReady) {
    return (
      <div className="bg-[#121a2f] min-h-[calc(100vh-64px)] container mx-auto px-4 flex flex-col justify-start items-center">
        <div className="w-full max-w-5xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Ticket Trading</h1>
          </div>
          <div className="flex flex-col justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-gray-300">Loading your tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  // If there are no tickets, show the empty state - only after data is fully loaded
  if (userTickets.length === 0) {
    return (
      <div className="bg-[#121a2f] min-h-[calc(100vh-64px)] container mx-auto px-4 flex flex-col justify-start items-center">
        <div className="w-full max-w-5xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Ticket Trading</h1>
          </div>
          
          {/* Trading Rules (Highlighted and Prominent) */}
          <Card className="p-5 mb-8 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
            <h3 className="text-xl text-blue-400 font-semibold mb-2">Trading Rules</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-1 font-medium">
              <li>You can only trade tickets from the same event</li>
              <li>Tickets must be in the same category</li>
              <li>Both parties must agree to the trade</li>
            </ul>
          </Card>
          
          <div className="bg-[#1a2642] rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-gray-300 mb-4">You don't have any tickets available for trading.</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Browse Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121a2f] min-h-[calc(100vh-64px)] container mx-auto px-4 flex flex-col justify-start items-center overflow-y-auto">
      <div className="w-full max-w-5xl">
        {/* Updated notification style matching MyTicketsPage */}
        {notification && (
          <div className="fixed top-20 right-4 z-50 w-[90%] max-w-sm animate-slide-down">
            <div className="relative overflow-hidden flex items-center p-4 rounded-lg shadow-lg bg-[#1a2642] border border-blue-900">
              <div className="mr-3">
                {notification.type === 'success' ? (
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : notification.type === 'error' ? (
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                )}
              </div>
              <div className="flex-1 text-white">{notification.message}</div>
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 animate-shrink"
                style={{ transformOrigin: 'left' }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Ticket Trading</h1>
        </div>
      
        {/* Pending Trade Requests Section */}
        {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
          <div ref={tradeRequestsRef} className="mb-8">
            <Card className="p-5 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30">
              <h3 className="text-xl text-purple-400 font-semibold mb-4">Pending Trade Requests</h3>
              
              {isLoadingRequests ? (
                <div className="flex justify-center items-center h-20">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                  <p className="text-sm text-gray-300">Loading trade requests...</p>
                </div>
              ) : (
                <>
                  {/* Incoming Requests */}
                  {incomingRequests.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-white font-medium mb-2">Incoming Requests ({incomingRequests.length})</h4>
                      <div className="space-y-3">
                        {incomingRequests.map(request => {
                          // Get details of requester's ticket
                          const requesterTicketDetails = getTicketDetailsById(request.ticketID, request);
                          // Get details of your ticket they want
                          const yourTicketDetails = getTicketDetailsById(request.requestedTicketID, request);
                          
                          return (
                          <div key={request.tradeRequestID} className="bg-[#1a2642] p-3 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="w-full md:w-4/5">
                              <p className="text-white text-sm font-medium mb-1">
                                <span className="text-gray-400">From:</span> User {request.requesterID}
                              </p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                                <div className="bg-[#12203f] p-3 rounded-lg">
                                  <h5 className="text-xs text-blue-400 font-semibold mb-2">Their Ticket:</h5>
                                  <p className="text-white text-xs font-medium">{requesterTicketDetails.eventTitle}</p>
                                  <p className="text-gray-300 text-xs mb-2">{requesterTicketDetails.eventDate}</p>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-gray-400 text-xs">Category:</span>
                                    <span className="text-white text-xs">{requesterTicketDetails.category}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400 text-xs">Section:</span>
                                    <span className="text-white text-xs">{requesterTicketDetails.section}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400 text-xs">Seat:</span>
                                    <span className="text-white text-xs">{requesterTicketDetails.seat}</span>
                                  </div>
                                </div>
                                
                                <div className="bg-[#12203f] p-3 rounded-lg">
                                  <h5 className="text-xs text-purple-400 font-semibold mb-2">Your Ticket:</h5>
                                  <p className="text-white text-xs font-medium">{yourTicketDetails.eventTitle}</p>
                                  <p className="text-gray-300 text-xs mb-2">{yourTicketDetails.eventDate}</p>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-gray-400 text-xs">Category:</span>
                                    <span className="text-white text-xs">{yourTicketDetails.category}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400 text-xs">Section:</span>
                                    <span className="text-white text-xs">{yourTicketDetails.section}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400 text-xs">Seat:</span>
                                    <span className="text-white text-xs">{yourTicketDetails.seat}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-gray-300 text-xs">
                                <span className="text-gray-400">Created:</span> {new Date(request.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 md:ml-auto self-end md:self-center w-full md:w-auto md:h-full md:justify-center md:py-4 md:px-2">
                              <Button 
                                className="text-xs bg-green-600 hover:bg-green-700 text-white w-full"
                                onClick={() => openAcceptConfirmation(request)}
                              >
                                Accept
                              </Button>
                              <Button 
                                className="text-xs bg-red-600 hover:bg-red-700 text-white w-full"
                                onClick={() => openDeclineConfirmation(request)}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}
                  
                  {/* Outgoing Requests */}
                  {outgoingRequests.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Outgoing Requests ({outgoingRequests.length})</h4>
                      <div className="space-y-3">
                        {outgoingRequests.map(request => {
                          // Get details of your ticket you're offering
                          const yourTicketDetails = getTicketDetailsById(request.ticketID, request);
                          // Get details of their ticket you want
                          const theirTicketDetails = getTicketDetailsById(request.requestedTicketID, request);
                          
                          return (
                          <div key={request.tradeRequestID} className="bg-[#1a2642] p-3 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="w-full md:w-4/5">
                              <p className="text-white text-sm font-medium mb-1">
                                <span className="text-gray-400">To:</span> User {request.requestedUserID}
                              </p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                                <div className="bg-[#12203f] p-3 rounded-lg">
                                  <h5 className="text-xs text-purple-400 font-semibold mb-2">Your Ticket:</h5>
                                  <p className="text-white text-xs font-medium">{yourTicketDetails.eventTitle}</p>
                                  <p className="text-gray-300 text-xs mb-2">{yourTicketDetails.eventDate}</p>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-gray-400 text-xs">Category:</span>
                                    <span className="text-white text-xs">{yourTicketDetails.category}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400 text-xs">Section:</span>
                                    <span className="text-white text-xs">{yourTicketDetails.section}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400 text-xs">Seat:</span>
                                    <span className="text-white text-xs">{yourTicketDetails.seat}</span>
                                  </div>
                                </div>
                                
                                <div className="bg-[#12203f] p-3 rounded-lg">
                                  <h5 className="text-xs text-blue-400 font-semibold mb-2">Their Ticket:</h5>
                                  <p className="text-white text-xs font-medium">{theirTicketDetails.eventTitle}</p>
                                  <p className="text-gray-300 text-xs mb-2">{theirTicketDetails.eventDate}</p>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-gray-400 text-xs">Category:</span>
                                    <span className="text-white text-xs">{theirTicketDetails.category}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400 text-xs">Section:</span>
                                    <span className="text-white text-xs">{theirTicketDetails.section}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400 text-xs">Seat:</span>
                                    <span className="text-white text-xs">{theirTicketDetails.seat}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-gray-300 text-xs">
                                <span className="text-gray-400">Created:</span> {new Date(request.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 md:ml-auto self-end md:self-center w-full md:w-auto md:h-full md:justify-center md:py-4 md:px-2">
                              <Button 
                                className="text-xs bg-red-600 hover:bg-red-700 text-white w-full"
                                onClick={() => openCancelConfirmation(request)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        )}
        
        {/* Trading Rules (Highlighted and Prominent) */}
        <Card className="p-5 mb-8 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
          <h3 className="text-xl text-blue-400 font-semibold mb-2">Trading Rules</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1 font-medium">
            <li>You can only trade tickets from the same event</li>
            <li>Tickets must be in the same category</li>
            <li>Both parties must agree to the trade</li>
          </ul>
        </Card>
        
        {/* User's Tickets Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Select a Ticket to Trade</h2>
          <p className="mb-6 text-gray-300">
            Click on one of your tickets below to see available trading options.
          </p>
          
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
              {transactionGroups.map((transaction) => {
                const firstTicket = transaction.tickets[0];
                const seatDetails = parseSeatDetails(firstTicket.seatID);
                const categoryColor = getCategoryColor(seatDetails?.category);
                const categoryName = getCategoryName(seatDetails?.category);
                
                return (
                  <div key={transaction.transactionID} className="w-full">
                    <Card 
                      className="overflow-hidden border-0 h-full bg-[#1a2642] text-white"
                    >
                      <div className="relative">
                        <img 
                          src={getEventImage(transaction.eventTitle)}
                          alt={transaction.eventTitle} 
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge 
                            className="text-white font-medium px-2 py-1"
                            style={{ backgroundColor: getCategoryColorHex(categoryColor) }}
                          >
                            {categoryName}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-white">{transaction.eventTitle}</h3>
                        <p className="text-gray-300 text-sm mb-2">
                          {transaction.eventDate} at {transaction.eventTime}
                        </p>
                        
                        <div className="border-t border-blue-900 pt-3 mb-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400 text-sm">Number of Tickets:</span>
                            <span className="text-white text-sm font-medium">{transaction.numTickets}</span>
                          </div>
                        </div>
                        
                        <Button
                          className="w-full text-sm bg-blue-700 hover:bg-blue-600 text-white"
                          variant="default"
                          onClick={() => handleShowDetails(transaction)}
                        >
                          Ticket Details
                        </Button>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Available Tickets Section */}
        {selectedTicket && (
          <div ref={availableTicketsRef} className="mt-16 border-t border-gray-700 pt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Available Trades for Your Ticket
              </h2>
            </div>
            
            {/* Selected Ticket Display (Centered) */}
            <div className="flex justify-center mb-8">
              <div className="w-full max-w-3xl">
                <div className="bg-[#12203f] p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-white mb-4 text-center">
                    Your Selected Ticket
                  </h3>
                  <div className="flex flex-col md:flex-row gap-4 p-3 bg-[#1a2642] rounded-lg">
                    <div className="md:w-1/6">
                      <img 
                        src={getEventImage(selectedTicket.eventTitle)}
                        alt={selectedTicket.eventTitle} 
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                    <div className="md:w-5/6 flex flex-col justify-center">
                      <h4 className="text-lg font-bold text-white">{selectedTicket.eventTitle}</h4>
                      <p className="text-gray-300 text-sm">{selectedTicket.eventDate} at {selectedTicket.eventTime}</p>
                      <div className="flex flex-wrap gap-x-4 text-sm mt-2">
                        {(() => {
                          const seatDetails = parseSeatDetails(selectedSeat);
                          return (
                            <>
                              <span className="text-gray-300">
                                <span className="font-medium">Category:</span> {getCategoryName(seatDetails?.category)}
                              </span>
                              <span className="text-gray-300">
                                <span className="font-medium">Section:</span> {seatDetails?.section || 'Unknown'}
                              </span>
                              <span className="text-gray-300">
                                <span className="font-medium">Seat:</span> {seatDetails?.seat || 'Unknown'}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Transaction group has multiple tickets */}
                  {userTickets.filter(t => t.transactionID === selectedTicket.transactionID).length > 1 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-300 mb-2">Select which ticket you want to trade:</p>
                      <div className="flex flex-wrap gap-2">
                        {userTickets
                          .filter(t => t.transactionID === selectedTicket.transactionID)
                          .map(ticket => {
                            const seatDetails = parseSeatDetails(ticket.seatID);
                            return (
                              <Button 
                                key={ticket.ticketID}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSeatSelect(ticket.seatID);
                                }}
                                className={`px-4 py-2 ${
                                  selectedSeat === ticket.seatID
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                }`}
                              >
                                {ticket.listed_for_trade ? 
                                  `Seat ${seatDetails?.seat || 'Unknown'}` : 
                                  `Seat ${seatDetails?.seat || 'Unknown'}`}
                              </Button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  
                  {/* Currently Trading Indicator */}
                  <div className="bg-blue-900/20 p-3 rounded-lg mt-4 text-center">
                    <p className="text-blue-300 font-medium">
                      {(() => {
                        const seatDetails = parseSeatDetails(selectedSeat);
                        return `Currently trading: Section ${seatDetails?.section || 'Unknown'}, Seat ${seatDetails?.seat || 'Unknown'}`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {isLoadingTrades ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-lg text-gray-300">Loading available trades...</p>
              </div>
            ) : availableTickets.length === 0 ? (
              <div className="bg-[#12203f] p-8 text-center rounded-lg">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-gray-300 mb-4">
                  No tickets available for trade in this category and event.
                </p>
                <Button 
                  onClick={() => setSelectedTicket(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Choose a Different Ticket
                </Button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Available Tickets for Trade</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
                {availableTickets.map(ticket => {
                  const seatDetails = parseSeatDetails(ticket.seatID);
                  const categoryName = getCategoryName(seatDetails?.category);
                  const categoryColor = getCategoryColor(seatDetails?.category);
                  
                  return (
                    <Card key={ticket.ticketID} className="overflow-hidden bg-[#1a2642] border-0 text-white">
                      <div className="h-full flex flex-col">
                        <div>
                          <div className="h-48 relative">
                            <img 
                              src={getEventImage(ticket.eventTitle)}
                              alt={ticket.eventTitle} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 right-3">
                              <Badge 
                                className="text-white font-medium px-2 py-1"
                                style={{ backgroundColor: getCategoryColorHex(categoryColor) }}
                              >
                                {categoryName}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex justify-between">
                            <h3 className="text-lg font-medium text-white mb-1">{ticket.eventTitle}</h3>
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-1">{ticket.eventDate} at {ticket.eventTime}</p>
                          
                          <div className="py-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Section:</span>
                              <span className="text-white text-sm font-medium">{seatDetails?.section || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Seat:</span>
                              <span className="text-white text-sm font-medium">{seatDetails?.seat || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Owner ID:</span>
                              <span className="text-white text-sm font-medium">{ticket.userID}</span>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => handleTradeClick(ticket)}
                            className="w-full mt-auto py-2 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium"
                          >
                            Trade for This Ticket
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Trade Confirmation Modal */}
        {showTradeModal && ticketToTrade && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-[#1a2642] rounded-lg p-6 max-w-lg w-full border border-blue-900">
              <h3 className="text-xl font-bold text-white mb-4">
                Confirm Trade Request
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#12203f] p-3 rounded-lg">
                  <h4 className="font-medium text-white text-sm mb-2">Your Ticket:</h4>
                  <p className="text-gray-200 font-medium">{selectedTicket.eventTitle}</p>
                  <p className="text-gray-300 text-sm">{selectedTicket.eventDate}</p>
                  {(() => {
                    const seatDetails = parseSeatDetails(selectedSeat);
                    return (
                      <p className="text-gray-300 text-sm mb-2">
                        Section {seatDetails?.section || 'Unknown'}, Seat {seatDetails?.seat || 'Unknown'}
                      </p>
                    );
                  })()}
                </div>
                
                <div className="bg-[#12203f] p-3 rounded-lg">
                  <h4 className="font-medium text-white text-sm mb-2">Trade For:</h4>
                  <p className="text-gray-200 font-medium">{selectedTicket.eventTitle}</p>
                  <p className="text-gray-300 text-sm">
                    {selectedTicket.eventDate}
                  </p>
                  {(() => {
                    const seatDetails = parseSeatDetails(ticketToTrade.seatID);
                    return (
                      <p className="text-gray-300 text-sm mb-2">
                        Section {seatDetails?.section || 'Unknown'}, Seat {seatDetails?.seat || 'Unknown'}
                      </p>
                    );
                  })()}
                </div>
              </div>
              
              <div className="bg-blue-900/20 p-3 rounded-lg mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Important Information</p>
                    <p className="text-blue-200 text-xs">
                      By confirming this trade, you're initiating a request to trade your ticket. The other ticket owner will need to approve this request. Once approved, the trade is final.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end">
                <Button 
                  onClick={() => setShowTradeModal(false)}
                  variant="outline"
                  className="font-medium border-gray-400 text-gray-200"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmTrade}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Confirm Trade Request
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Details Modal */}
        {showDetailsModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#1e1e24] rounded-lg shadow-lg p-6 max-w-4xl w-full border border-blue-900">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  Ticket Details: {selectedTransaction.eventTitle}
                </h3>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-[#12203f] rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Event:</span>
                  <span className="text-white font-medium">{selectedTransaction.eventTitle}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Date & Time:</span>
                  <span className="text-white">{selectedTransaction.eventDate} at {selectedTransaction.eventTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="text-white text-sm">{selectedTransaction.transactionID}</span>
                </div>
              </div>
              
              <h4 className="text-lg font-semibold text-white mb-4">Individual Tickets</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedTransaction.tickets.map(ticket => {
                  const seatDetails = parseSeatDetails(ticket.seatID);
                  return (
                    <Card key={ticket.ticketID} className="overflow-hidden bg-[#12203f] border border-blue-900">
                      <div className="p-4">
                        <div className="mb-3 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Section:</span>
                            <span className="text-white text-sm font-medium">{seatDetails?.section || 'Unknown'}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Seat:</span>
                            <span className="text-white text-sm font-medium">{seatDetails?.seat || 'Unknown'}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Category:</span>
                            <span className="text-sm">
                              {(() => {
                                return (
                                  <Badge 
                                    className="text-white font-medium px-2 py-1"
                                    style={{ backgroundColor: getCategoryColorHex(getCategoryColor(seatDetails?.category)) }}
                                  >
                                    {getCategoryName(seatDetails?.category)}
                                  </Badge>
                                );
                              })()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button
                            className="flex-1 text-sm border-2 border-purple-600 bg-transparent hover:bg-purple-600/10 text-white"
                            variant="default"
                            onClick={() => {
                              setShowDetailsModal(false);
                              setSelectedTicket(ticket);
                              setSelectedSeat(ticket.seatID);
                              fetchAvailableTicketsForTrade(ticket, ticket.seatID);
                            }}
                          >
                            Use for Trade
                          </Button>
                          
                          <Button
                            className={`flex-1 text-sm ${
                              ticket.listed_for_trade 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-[#2d3a51] hover:bg-[#354159]'
                            } text-white`}
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTradeStatus(ticket, e);
                              setShowDetailsModal(false);
                            }}
                          >
                            {ticket.listed_for_trade ? 'Listed for Trade' : 'List for Trade'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="default" 
                  className="bg-blue-700 hover:bg-blue-600 text-white"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Accept Confirmation Modal */}
        {showAcceptModal && selectedRequestDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-[#1a2642] rounded-lg p-6 max-w-lg w-full border border-blue-900">
              <h3 className="text-xl font-bold text-white mb-4">
                Confirm Trade Acceptance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#12203f] p-3 rounded-lg">
                  <h4 className="font-medium text-white text-sm mb-2">Their Ticket:</h4>
                  <p className="text-gray-200 font-medium">
                    {getTicketDetailsById(selectedRequestDetails.ticketID, selectedRequestDetails).eventTitle}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {getTicketDetailsById(selectedRequestDetails.ticketID, selectedRequestDetails).eventDate}
                  </p>
                  <p className="text-gray-300 text-sm mb-2">
                    Section {getTicketDetailsById(selectedRequestDetails.ticketID, selectedRequestDetails).section},
                    Seat {getTicketDetailsById(selectedRequestDetails.ticketID, selectedRequestDetails).seat}
                  </p>
                </div>
                
                <div className="bg-[#12203f] p-3 rounded-lg">
                  <h4 className="font-medium text-white text-sm mb-2">Your Ticket:</h4>
                  <p className="text-gray-200 font-medium">
                    {getTicketDetailsById(selectedRequestDetails.requestedTicketID, selectedRequestDetails).eventTitle}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {getTicketDetailsById(selectedRequestDetails.requestedTicketID, selectedRequestDetails).eventDate}
                  </p>
                  <p className="text-gray-300 text-sm mb-2">
                    Section {getTicketDetailsById(selectedRequestDetails.requestedTicketID, selectedRequestDetails).section},
                    Seat {getTicketDetailsById(selectedRequestDetails.requestedTicketID, selectedRequestDetails).seat}
                  </p>
                </div>
              </div>
              
              <div className="bg-green-900/20 p-3 rounded-lg mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="text-green-300 text-sm font-medium">Important Information</p>
                    <p className="text-green-200 text-xs">
                      By accepting this trade, you agree to swap your ticket with the requester's ticket. This action cannot be undone once completed.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end">
                <Button 
                  onClick={() => setShowAcceptModal(false)}
                  variant="outline"
                  className="font-medium border-gray-400 text-gray-200"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleAcceptTradeRequest(selectedRequestId)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  Confirm Accept
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Decline Confirmation Modal */}
        {showDeclineModal && selectedRequestDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-[#1a2642] rounded-lg p-6 max-w-lg w-full border border-blue-900">
              <h3 className="text-xl font-bold text-white mb-4">
                Confirm Decline Trade Request
              </h3>
              
              <div className="bg-[#12203f] p-4 rounded-lg mb-6">
                <p className="text-white">
                  Are you sure you want to decline the trade request from user {selectedRequestDetails.requesterID}?
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  This action will remove the request from your pending trades list.
                </p>
              </div>
              
              <div className="bg-red-900/20 p-3 rounded-lg mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-red-300 text-sm">
                    The requester will be notified that you have declined their trade request.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end">
                <Button 
                  onClick={() => setShowDeclineModal(false)}
                  variant="outline"
                  className="font-medium border-gray-400 text-gray-200"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleDeclineTradeRequest(selectedRequestId)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Confirm Decline
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Cancel Confirmation Modal */}
        {showCancelModal && selectedRequestDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-[#1a2642] rounded-lg p-6 max-w-lg w-full border border-blue-900">
              <h3 className="text-xl font-bold text-white mb-4">
                Confirm Cancel Trade Request
              </h3>
              
              <div className="bg-[#12203f] p-4 rounded-lg mb-6">
                <p className="text-white">
                  Are you sure you want to cancel your trade request to user {selectedRequestDetails.requestedUserID}?
                </p>
                <p className="text-gray-300 text-sm mt-2">
                  This action will remove the request from both your pending trades list and the recipient's list.
                </p>
              </div>
              
              <div className="bg-red-900/20 p-3 rounded-lg mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-red-300 text-sm">
                    You can always create a new trade request later if you change your mind.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end">
                <Button 
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                  className="font-medium border-gray-400 text-gray-200"
                >
                  Go Back
                </Button>
                <Button 
                  onClick={() => handleCancelTradeRequest(selectedRequestId)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Confirm Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingPage; 