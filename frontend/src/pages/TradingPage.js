import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import myTicketService from '../services/myTicketService';
import { useAuth } from '../context/AuthContext';
import { parseSeatDetails, getCategoryColor, getCategoryName } from '../utils/seatUtils';

// Map of artist names to their image filenames
const artistImageMap = {
  'Benjamin Kheng': 'benkheng.jpg',
  'Bruno Mars': 'brunomars.jpg',
  'Carly Rae Jepsen': 'carly.jpg',
  'Lady Gaga': 'ladygaga.jpg',
  'Lauv': 'lauv.png',
  'Taylor Swift': 'taylorswift.webp',
  'Yoasobi': 'yoasobi.jpg'
};

// Image mapping function based on artistImageMap
const getEventImage = (artistName) => {
  if (!artistName) {
    console.log('No artist name provided for event image');
    return '/events/default.jpg';
  }
  
  // Get the image filename for this artist
  const imageFilename = artistImageMap[artistName];
  if (!imageFilename) {
    console.log(`No image found for artist: ${artistName}`);
    return '/events/default.jpg';
  }
  
  return `/events/${imageFilename}`;
};

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
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [ticketToTrade, setTicketToTrade] = useState(null);
  const [notification, setNotification] = useState(null);
  const availableTicketsRef = useRef(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const notificationTimerRef = useRef(null);

  // Fetch available tickets for trade
  const fetchAvailableTicketsForTrade = useCallback(async (ticket, seatID) => {
    if (!ticket || !seatID) return;
    
    setIsLoadingTrades(true);
    
    try {
      // Parse the seat details to get the category
      const seatDetails = parseSeatDetails(seatID);
      if (!seatDetails) {
        console.error('Failed to parse seat details');
        setIsLoadingTrades(false);
        return;
      }
      
      // Log selected ticket details for debugging
      console.log('Selected ticket for trade:', {
        ticketID: ticket.ticketID,
        eventID: ticket.eventID,
        eventTitle: ticket.eventTitle,
        seatID: ticket.seatID,
        category: seatDetails.category
      });
      
      // Get full event details for the selected ticket
      let eventDetails;
      try {
        const eventResponse = await myTicketService.getEventDetails(ticket.eventID);
        eventDetails = {
          eventTitle: eventResponse?.EventResponse?.Artist || ticket.eventTitle || 'Unknown Event',
          eventDate: eventResponse?.EventResponse?.EventDate || ticket.eventDate || 'Unknown Date',
          eventTime: eventResponse?.EventResponse?.EventTime || ticket.eventTime || 'Unknown Time',
          eventID: ticket.eventID
        };
        console.log('Fetched complete event details:', eventDetails);
      } catch (err) {
        console.error('Error fetching event details:', err);
        eventDetails = {
          eventTitle: ticket.eventTitle,
          eventDate: ticket.eventDate,
          eventTime: ticket.eventTime,
          eventID: ticket.eventID
        };
      }
      
      // Call the API to get tradeable tickets
      // These are tickets with the same event and category, different user, and listed_for_trade=true
      const tradableTickets = await myTicketService.getTradeableTickets(
        ticket.eventID,
        seatDetails.category
      );
      
      // Filter out tickets owned by the current user
      const filteredTickets = tradableTickets.filter(ticket => 
        ticket.userID !== backendUserId && ticket.listed_for_trade === true
      );
      
      console.log('Available tradable tickets (raw):', filteredTickets);
      
      // Log event details that will be used
      console.log('Event details being applied to trade tickets:', eventDetails);
      
      // Enrich tickets with event information from selected ticket
      const enrichedTickets = filteredTickets.map(tradeTicket => ({
        ...tradeTicket,
        eventTitle: eventDetails.eventTitle,
        eventDate: eventDetails.eventDate,
        eventTime: eventDetails.eventTime,
        eventID: eventDetails.eventID
      }));
      
      // Log enriched tickets
      enrichedTickets.forEach(ticket => {
        console.log(`Trade Ticket ${ticket.ticketID} enriched with: ${ticket.eventTitle}, ${ticket.eventDate}`);
      });
      
      console.log(`Found ${enrichedTickets.length} tickets available for trade`);
      setAvailableTickets(enrichedTickets);
      
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

  // Fetch user's tickets
  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!backendUserId) return;
      
      setIsLoading(true);
      
      try {
        // Fetch tickets grouped by transaction
        const transactions = await myTicketService.getMyTickets(backendUserId);
        console.log(`TradingPage: Fetched ${transactions.length} transactions for user ${backendUserId}`);
        
        // Log transaction details for debugging event data
        transactions.forEach(txn => {
          console.log(`Transaction ${txn.transactionID} has event title: "${txn.eventTitle}", date: ${txn.eventDate}`);
        });
        
        setTicketTransactions(transactions);
        
        // Fetch individual tickets for the transactions
        const ticketDetails = [];
        
        for (const txn of transactions) {
          // Only include active (not voided) tickets
          if (txn.status !== 'voided') {
            const tickets = await myTicketService.getTicketsByTransaction(txn.transactionID);
            console.log(`TradingPage: Transaction ${txn.transactionID} has ${tickets.length} tickets`);
            
            // Log details of all tickets in this transaction
            tickets.forEach(ticket => {
              console.log(`TradingPage: Ticket ${ticket.ticketID}, Seat ${ticket.seatID}, User ${ticket.userID}`);
            });
            
            const verifiedTickets = await Promise.all(
              tickets.map(async (ticket) => {
                // Fetch additional details if needed
                const tradability = await myTicketService.verifyTicketTradable(ticket.ticketID);
                
                // Try to get more complete event details if they're missing
                let eventInfo = {
                  eventTitle: txn.eventTitle,
                  eventDate: txn.eventDate,
                  eventTime: txn.eventTime
                };
                
                // If we're missing event details, try to fetch them directly
                if (!eventInfo.eventTitle || eventInfo.eventTitle === 'Unknown Event') {
                  try {
                    const eventResponse = await myTicketService.getEventDetails(ticket.eventID);
                    if (eventResponse && eventResponse.EventResponse) {
                      eventInfo = {
                        eventTitle: eventResponse.EventResponse.Artist || eventInfo.eventTitle,
                        eventDate: eventResponse.EventResponse.EventDate || eventInfo.eventDate,
                        eventTime: eventResponse.EventResponse.EventTime || eventInfo.eventTime
                      };
                    }
                  } catch (err) {
                    console.error(`Error fetching event details for ticket ${ticket.ticketID}:`, err);
                  }
                }
                
                // Add eventTitle and other details from the transaction
                return {
                  ...ticket,
                  eventTitle: eventInfo.eventTitle,
                  eventDate: eventInfo.eventDate,
                  eventTime: eventInfo.eventTime,
                  tradability: tradability,
                  transactionID: txn.transactionID
                };
              })
            );
            
            ticketDetails.push(...verifiedTickets);
          }
        }
        
        // Filter to ensure we only have tickets belonging to the current user
        const userOwnedTickets = ticketDetails.filter(ticket => ticket.userID === backendUserId);
        console.log(`TradingPage: Filtered ${ticketDetails.length} total tickets to ${userOwnedTickets.length} owned by user ${backendUserId}`);
        
        // Log all ticket details
        userOwnedTickets.forEach(ticket => {
          console.log(`TradingPage: User ticket - ${ticket.ticketID}, Seat ${ticket.seatID}, User ${ticket.userID}, EventTitle: ${ticket.eventTitle}`);
        });
        
        // Remove duplicate tickets by keeping only one instance of each seatID
        const uniqueTickets = Array.from(
          userOwnedTickets.reduce((map, ticket) => {
            if (!map.has(ticket.seatID)) {
              map.set(ticket.seatID, ticket);
            }
            return map;
          }, new Map()).values()
        );
        
        console.log('Unique tickets:', uniqueTickets.length);
        setUserTickets(uniqueTickets);
        
        // If a ticket was passed via location state, pre-select it
        if (location.state?.ticket) {
          const preSelectedTicket = location.state.ticket;
          
          // Find the matching ticket in our fetched data
          const matchedTicket = uniqueTickets.find(t => t.ticketID === preSelectedTicket.ticketID);
          if (matchedTicket) {
            setSelectedTicket(matchedTicket);
            setSelectedSeat(matchedTicket.seatID);
            fetchAvailableTicketsForTrade(matchedTicket, matchedTicket.seatID);
          }
        }
      } catch (error) {
        console.error('Error fetching user tickets:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load your tickets'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserTickets();
  }, [backendUserId, location.state, fetchAvailableTicketsForTrade]);

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
    // Will be implemented later
    setShowTradeModal(false);
    setNotification({
      type: 'info',
      message: 'Trade functionality will be implemented in the next phase'
    });
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

  // Show a loading state while data is being prepared
  if (isLoading && !userTickets.length) {
    return (
      <div className="bg-[#121a2f] min-h-[calc(100vh-64px)] container mx-auto px-4 flex flex-col justify-start items-center">
        <div className="w-full max-w-5xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Ticket Trading</h1>
          </div>
          <div className="flex justify-center items-center h-64">
            <p className="text-lg text-gray-300">Loading your tickets...</p>
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
      
        {/* Trading Rules (Highlighted and Prominent) */}
        <Card className="p-5 mb-8 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
          <h3 className="text-xl text-blue-400 font-semibold mb-2">Trading Rules</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1 font-medium">
            <li>You can only trade tickets from the same event</li>
            <li>Tickets must be in the same category</li>
            <li>Both parties must agree to the trade</li>
            <li>Only tradable tickets can be exchanged</li>
          </ul>
        </Card>
        
        {/* User's Tickets Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4">Select a Ticket to Trade</h2>
          <p className="mb-6 text-gray-300">
            Click on one of your tickets below to see available trading options.
          </p>
          
          {userTickets.length === 0 ? (
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
          ) : (
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
                              className={`bg-${categoryColor}-600 text-white font-medium px-2 py-1`}
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
          )}
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
                                className={`bg-${categoryColor}-600 text-white font-medium px-2 py-1`}
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
                  <p className="text-gray-300 text-sm">{selectedTicket.eventDate}</p>
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
                              <Badge 
                                className={`bg-${getCategoryColor(seatDetails?.category)}-600 text-white font-medium px-2 py-1`}
                              >
                                {getCategoryName(seatDetails?.category)}
                              </Badge>
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
      </div>
    </div>
  );
};

export default TradingPage; 