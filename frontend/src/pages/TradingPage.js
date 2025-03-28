import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const TradingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userTickets, setUserTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null); // Track which specific seat is selected
  const [availableTickets, setAvailableTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [ticketToTrade, setTicketToTrade] = useState(null);
  const availableTicketsRef = useRef(null);

  // Fetch user's tickets
  useEffect(() => {
    const fetchUserTickets = async () => {
      setIsLoading(true);
      
      try {
        // For demo purposes, use mock data with a short delay
        setTimeout(() => {
          const mockTickets = [
            {
              id: 'TKT-1234-5678',
              eventTitle: 'Taylor Swift: The Eras Tour',
              eventDate: 'June 15, 2023',
              eventTime: '7:30 PM',
              location: 'MetLife Stadium, New Jersey',
              category: 'VIP',
              section: 'A',
              row: '1',
              seats: ['12', '13'],
              price: 450.00,
              purchaseDate: '2023-04-10',
              status: 'active',
              qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TKT-1234-5678',
              eventImage: 'https://source.unsplash.com/random/800x500/?concert',
            },
            {
              id: 'TKT-8765-4321',
              eventTitle: 'Coldplay: Music of the Spheres',
              eventDate: 'August 22, 2023',
              eventTime: '8:00 PM',
              location: 'Wembley Stadium, London',
              category: 'CAT1',
              section: 'B',
              row: '5',
              seats: ['22'],
              price: 180.00,
              purchaseDate: '2023-05-15',
              status: 'active',
              qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TKT-8765-4321',
              eventImage: 'https://source.unsplash.com/random/800x500/?music',
            }
          ];
          
          // If a ticket was passed via location state, pre-select it
          if (location.state?.ticket) {
            const preSelectedTicket = location.state.ticket;
            setUserTickets(mockTickets);
            
            // Find the matching ticket in our mock data or use the passed one
            const matchedTicket = mockTickets.find(t => t.id === preSelectedTicket.id) || preSelectedTicket;
            setSelectedTicket(matchedTicket);
            setSelectedSeat(matchedTicket.seats[0]); // Default to first seat
            fetchAvailableTicketsForTrade(matchedTicket, matchedTicket.seats[0]);
          } else {
            setUserTickets(mockTickets);
            setIsLoading(false);
          }
        }, 300);
        
      } catch (error) {
        console.error('Error fetching user tickets:', error);
        setIsLoading(false);
      }
    };
    
    fetchUserTickets();
  }, [location.state]);

  // Fetch available tickets for trade
  const fetchAvailableTicketsForTrade = useCallback((ticket, seatNumber) => {
    setIsLoading(true);
    
    // In a real app, this would be an API call
    /*
    * MICROSERVICE INTEGRATION POINT:
    * 
    * In production, you would fetch from the trading microservice:
    * const response = await fetch(`https://api-gateway.example.com/trading/available-tickets?category=${ticket.category}&eventTitle=${ticket.eventTitle}&seat=${seatNumber}`, {
    *   headers: { Authorization: `Bearer ${token}` }
    * });
    * const data = await response.json();
    */
    
    // For demo purposes, use mock data with a short delay
    setTimeout(() => {
      const mockAvailableTickets = [
        {
          id: 'TKT-2468-1357',
          eventTitle: ticket.eventTitle,
          eventDate: ticket.eventDate,
          eventTime: ticket.eventTime,
          location: ticket.location,
          category: ticket.category,
          section: 'B',
          row: '3',
          seats: ['5'],
          price: ticket.price / ticket.seats.length, // Price per seat
          ownerName: 'John Smith',
          ownerRating: 4.8,
          tradePreference: 'same-event',
          eventImage: ticket.eventImage
        },
        {
          id: 'TKT-1357-2468',
          eventTitle: ticket.eventTitle,
          eventDate: ticket.eventDate,
          eventTime: ticket.eventTime,
          location: ticket.location,
          category: ticket.category,
          section: 'A',
          row: '5',
          seats: ['20'],
          price: ticket.price / ticket.seats.length, // Price per seat
          ownerName: 'Emily Johnson',
          ownerRating: 4.9,
          tradePreference: 'any',
          eventImage: ticket.eventImage
        }
      ];
      
      setAvailableTickets(mockAvailableTickets);
      setIsLoading(false);
      
      // Scroll to available tickets section after they're loaded
      if (availableTicketsRef.current) {
        setTimeout(() => {
          availableTicketsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }, 500);
  }, []);

  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedSeat(ticket.seats[0]); // Default to first seat
    fetchAvailableTicketsForTrade(ticket, ticket.seats[0]);
  };

  const handleSeatSelect = (seat) => {
    setSelectedSeat(seat);
    fetchAvailableTicketsForTrade(selectedTicket, seat);
  };

  const handleTradeClick = (tradeTicket) => {
    setTicketToTrade(tradeTicket);
    setShowTradeModal(true);
  };

  const confirmTrade = async () => {
    try {
      // In a real app, this would be an API call to process the trade
      /*
      * MICROSERVICE INTEGRATION POINT:
      * 
      * In production, you would call the trading microservice:
      * const response = await fetch('https://api-gateway.example.com/trading/process', {
      *   method: 'POST',
      *   headers: { 
      *     'Content-Type': 'application/json',
      *     Authorization: `Bearer ${token}` 
      *   },
      *   body: JSON.stringify({
      *     userTicketId: selectedTicket.id,
      *     userSeat: selectedSeat,
      *     tradeTicketId: ticketToTrade.id,
      *     tradeSeat: ticketToTrade.seats[0]
      *   })
      * });
      */
      
      // For demo purposes, go to success page
      setShowTradeModal(false);
      navigate('/trade-success', { 
        state: { 
          tradeData: {
            eventName: selectedTicket.eventTitle,
            tradedTickets: {
              category: selectedTicket.category,
              count: 1, // Always trading 1 seat at a time
              seat: selectedSeat
            },
            receivedTickets: {
              category: ticketToTrade.category,
              count: 1, // Always trading 1 seat at a time
              seat: ticketToTrade.seats[0]
            },
            tradeDate: new Date().toLocaleDateString()
          }
        }
      });
    } catch (error) {
      console.error('Error processing trade:', error);
      setShowTradeModal(false);
    }
  };

  // Show a loading state while data is being prepared
  if (isLoading && !userTickets.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ticket Trading</h1>
          <Button 
            onClick={() => navigate('/my-tickets')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
          >
            Back to My Tickets
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-500 dark:text-gray-400">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ticket Trading</h1>
        <Button 
          onClick={() => navigate('/my-tickets')}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
        >
          Back to My Tickets
        </Button>
      </div>
      
      {/* Trading Rules (Highlighted and Prominent) */}
      <Card className="p-5 mb-8 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30 dark:from-blue-900/20 dark:to-blue-800/20" glowEffect={true}>
        <h3 className="text-xl text-blue-700 dark:text-blue-300 font-semibold mb-2">Trading Rules</h3>
        <ul className="list-disc list-inside text-gray-800 dark:text-gray-200 space-y-1 font-medium">
          <li>You can only trade tickets from the same event</li>
          <li>Tickets must be in the same category</li>
          <li>Both parties must agree to the trade</li>
        </ul>
      </Card>
      
      {/* User's Tickets Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Select a Ticket to Trade</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Click on one of your tickets below to see available trading options.
        </p>
        
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl">
            {userTickets.map((ticket) => (
              <div key={ticket.id} onClick={() => handleTicketSelect(ticket)} className="cursor-pointer w-full sm:w-[340px]">
                <Card 
                  className={`overflow-hidden border-2 transition-all duration-200 h-full ${
                    selectedTicket && selectedTicket.id === ticket.id 
                      ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                      : 'border-transparent hover:border-blue-300'
                  }`}
                  glowEffect={selectedTicket && selectedTicket.id === ticket.id}
                >
                  <div className="relative h-48">
                    <img 
                      src={ticket.eventImage} 
                      alt={ticket.eventTitle} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge 
                        className={`bg-blue-600 text-white font-medium px-2 py-1`}
                      >
                        {ticket.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.eventTitle}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                      {ticket.eventDate} at {ticket.eventTime}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                      {ticket.location}
                    </p>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Section:</span>
                        <span className="text-gray-900 dark:text-white text-sm font-medium">{ticket.section}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Row:</span>
                        <span className="text-gray-900 dark:text-white text-sm font-medium">{ticket.row}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Seats:</span>
                        <span className="text-gray-900 dark:text-white text-sm font-medium">
                          {ticket.seats.join(', ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button 
                        className={`w-full font-bold ${
                          selectedTicket && selectedTicket.id === ticket.id 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {selectedTicket && selectedTicket.id === ticket.id 
                          ? 'Selected for Trading' 
                          : 'Select to Trade'}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Available Tickets Section */}
      {selectedTicket && (
        <div ref={availableTicketsRef} className="mt-16 border-t border-gray-200 dark:border-gray-700 pt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Available Trades for Your Ticket
            </h2>
            <Button 
              onClick={() => setSelectedTicket(null)}
              variant="outline"
              className="text-sm"
            >
              Choose a Different Ticket
            </Button>
          </div>
          
          {/* Selected Ticket Display (Centered) */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-3xl">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  Your Selected Ticket
                </h3>
                <div className="flex flex-col md:flex-row gap-4 p-3 bg-white dark:bg-gray-700 rounded-lg">
                  <div className="md:w-1/6">
                    <img 
                      src={selectedTicket.eventImage} 
                      alt={selectedTicket.eventTitle} 
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                  <div className="md:w-5/6 flex flex-col justify-center">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTicket.eventTitle}</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{selectedTicket.eventDate} at {selectedTicket.eventTime}</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{selectedTicket.location}</p>
                    <div className="flex flex-wrap gap-x-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Category:</span> {selectedTicket.category}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Section:</span> {selectedTicket.section}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Row:</span> {selectedTicket.row}
                      </span>
                    </div>
                    
                    {/* Seat Selection for Multiple-Seat Tickets */}
                    {selectedTicket.seats.length > 1 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select which seat you want to trade:</p>
                        <div className="flex gap-2">
                          {selectedTicket.seats.map(seat => (
                            <Button 
                              key={seat}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSeatSelect(seat);
                              }}
                              className={`px-4 py-2 ${
                                selectedSeat === seat
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              Seat {seat}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Currently Trading Indicator */}
                <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg mt-4 text-center">
                  <p className="text-blue-800 dark:text-blue-200 font-medium">
                    Currently trading: Seat {selectedSeat}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-lg text-gray-500 dark:text-gray-400">Loading available trades...</p>
            </div>
          ) : availableTickets.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 p-8 text-center rounded-lg">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
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
            <div className="grid grid-cols-1 gap-4">
              {availableTickets.map(ticket => (
                <Card key={ticket.id} className="overflow-hidden dark:bg-gray-700" glowEffect={true}>
                  <div className="grid grid-cols-1 md:grid-cols-3 h-full">
                    <div className="md:col-span-1">
                      <div className="h-full relative">
                        <img 
                          src={ticket.eventImage} 
                          alt={ticket.eventTitle} 
                          className="w-full h-full object-cover aspect-square md:aspect-auto"
                          style={{ maxHeight: '220px' }}
                        />
                        <div className="absolute bottom-2 left-2">
                          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                            {ticket.category}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 p-4 flex flex-col">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{ticket.eventTitle}</h3>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">${ticket.price.toFixed(2)}</span>
                      </div>
                      
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{ticket.eventDate} at {ticket.eventTime}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{ticket.location}</p>
                      
                      <div className="text-sm mb-4">
                        <div className="flex flex-wrap gap-4">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Section:</span>
                            <span className="text-gray-700 dark:text-gray-300 ml-1 font-medium">{ticket.section}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Row:</span>
                            <span className="text-gray-700 dark:text-gray-300 ml-1 font-medium">{ticket.row}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Seats:</span>
                            <span className="text-gray-700 dark:text-gray-300 ml-1 font-medium">{ticket.seats.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Owner: {ticket.ownerName}</span>
                          <div className="flex items-center">
                            <span className="text-sm text-yellow-500 mr-1">{ticket.ownerRating}</span>
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleTradeClick(ticket)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Trade for This Ticket
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Trade Confirmation Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Trade Request
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Your Ticket:</h4>
                <p className="text-gray-800 dark:text-gray-200 font-medium">{selectedTicket.eventTitle}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{selectedTicket.eventDate}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Section {selectedTicket.section}, Row {selectedTicket.row}, Seat {selectedSeat}
                </p>
                <p className="text-blue-600 dark:text-blue-400 font-medium">${(selectedTicket.price / selectedTicket.seats.length).toFixed(2)}</p>
              </div>
              
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">Trade For:</h4>
                <p className="text-gray-800 dark:text-gray-200 font-medium">{ticketToTrade.eventTitle}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{ticketToTrade.eventDate}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Section {ticketToTrade.section}, Row {ticketToTrade.row}, Seat {ticketToTrade.seats[0]}
                </p>
                <p className="text-blue-600 dark:text-blue-400 font-medium">${ticketToTrade.price.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">Important Information</p>
                  <p className="text-blue-700 dark:text-blue-300 text-xs">
                    By confirming this trade, you're initiating a request to trade your ticket. The other ticket owner will need to approve this request. Once approved, the trade is final.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-end">
              <Button 
                onClick={() => setShowTradeModal(false)}
                variant="outline"
                className="font-medium"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmTrade}
                variant="primary"
                className="font-bold"
              >
                Confirm Trade Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingPage; 