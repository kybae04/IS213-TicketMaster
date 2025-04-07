import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useMyTickets } from '../context/myTicketsContext';
import { useCancel } from '../context/cancelContext';
import { QRCodeSVG } from 'qrcode.react';
import { parseSeatDetails } from '../utils/seatUtils';
import { useAuth } from '../context/AuthContext';
import myTicketService from '../services/myTicketService';

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

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [notification, setNotification] = useState(null);
  const { 
    transactions, 
    fetchGroupedTickets, 
    loading, 
    error, 
    ticketDetails,
    fetchTicketDetails
  } = useMyTickets();
  const { checkRefundEligibility, cancelTicket } = useCancel();
  const [detailsLoading, setDetailsLoading] = useState(false);
  const notificationTimerRef = useRef(null);
  const { backendUserId } = useAuth();

  // Fetch tickets only once when component mounts
  useEffect(() => {
    fetchGroupedTickets();
  }, [fetchGroupedTickets]);

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
  
  // Show notification function
  const showNotification = (message, type = 'default') => {
    setNotification({ message, type });
  };

  // Group transactions by status
  const activeTransactions = transactions.filter(txn => txn.status !== 'voided');
  const cancelledTransactions = transactions.filter(txn => txn.status === 'voided');

  // call the refund-eligibility function, then if eligible, show the cancel modal
  const handleCancelClick = async (txn) => {
    const result = await checkRefundEligibility(txn.eventID);
    setTicketToCancel({ ...txn, refundEligible: result.refund_eligibility });
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    try {
      const response = await cancelTicket(ticketToCancel.transactionID, ticketToCancel.refundEligible);

      setTicketToCancel((prev) => ({
        ...prev,
        price: response.amount_refunded
      }));

      await fetchGroupedTickets();
      setShowCancelModal(false);

      // Navigate to success page
      navigate('/cancellation-success', {
        state: { ticket: ticketToCancel }
      });
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      setShowCancelModal(false);
    }
  };

  // Handle show ticket details in modal
  const handleShowDetails = async (transaction) => {
    setSelectedTransaction(transaction);
    setDetailsLoading(true);
    setShowDetailsModal(true);
    
    try {
      await fetchTicketDetails(transaction.transactionID);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Handle listing a ticket for trade
  const handleListForTrade = async (ticket) => {
    try {
      // First, close the modal
      setShowDetailsModal(false);
      
      // Clear any existing notification first
      setNotification(null);
      
      // Show notification after a small delay to ensure animation works properly
      setTimeout(() => {
        setNotification({
          type: 'success',
          message: 'Ticket listed for trade'
        });
      }, 10);
      
      // Then perform the API call (async)
      await myTicketService.toggleTradeStatus(ticket.ticketID, false);
      
      // No need to refresh the page or fetch new data
      // The UI is already updated with the modal closing and notification
      
    } catch (error) {
      console.error('Error listing ticket for trade:', error);
      
      // Show error notification with small delay for animation
      setTimeout(() => {
        setNotification({
          type: 'error',
          message: 'Failed to update trade status'
        });
      }, 10);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#121a2f] min-h-screen text-white pb-10">
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-lg text-gray-300">Loading your tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#121a2f] min-h-[calc(100vh-64px)] py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white text-center mb-6">My Tickets</h1>

          <div className="p-4 bg-red-100 border border-red-400 rounded mb-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Tickets</h3>
            <p className="text-red-700 mb-4">{error}</p>
            
            <div className="bg-white p-4 rounded border border-red-200 mb-4">
              <h4 className="font-medium mb-2">Possible Solutions:</h4>
              <ul className="list-disc list-inside">
                <li>Ensure you are logged in with a valid account</li>
                <li>Check that your account has tickets associated with it</li>
                <li>Try logging out and logging back in</li>
              </ul>
            </div>
            
            <div className="flex justify-center">
              <button 
                onClick={fetchGroupedTickets}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render a ticket transaction card
  const renderTicketCard = (ticket, index) => {
    return (
      <div key={ticket.transactionID || index} className="w-full max-w-sm">
        <Card className={`overflow-hidden w-full bg-[#1a2642] text-white border border-blue-900 ${ticket.status === 'voided' ? 'opacity-70' : ''}`}>
          <div className="relative h-48">
            <img
              src={getEventImage(ticket.eventTitle)}
              alt={ticket.eventTitle}
              className="w-full h-full object-cover"
            />
            {ticket.status === 'voided' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="bg-red-600 text-white px-4 py-2 rounded-md font-bold uppercase">
                  Cancelled
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-white">{ticket.eventTitle}</h3>
            </div>

            <p className="text-gray-300 text-sm mb-1">
              {ticket.eventDate} at {ticket.eventTime}
            </p>

            <div className="border-t border-blue-900 pt-3 mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400 text-sm">Number of Tickets:</span>
                <span className="text-white text-sm font-medium">{ticket.numTickets}</span>
              </div>
            </div>

            {ticket.status === 'voided' ? (
              <div className="bg-red-900/30 p-2 rounded mb-3">
                <p className="text-center text-red-400 text-lg font-bold">Refunded</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1 text-sm bg-blue-700 hover:bg-blue-600 text-white"
                  variant="default"
                  onClick={() => handleShowDetails(ticket)}
                >
                  Ticket Details
                </Button>
                <Button
                  className="flex-1 text-sm bg-red-600 hover:bg-red-500 text-white"
                  variant="default"
                  onClick={() => handleCancelClick(ticket)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  // Render no tickets message
  const renderNoTickets = () => {
    return (
      <div className="text-center py-12 bg-[#1a2642] rounded-lg max-w-md mx-auto border border-blue-900">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <h3 className="mt-2 text-lg font-medium text-white">No tickets found</h3>
        <p className="mt-1 text-gray-400">Browse events and purchase tickets to see them here.</p>
        <div className="mt-6">
          <Button
            onClick={() => navigate('/')}
            variant="primary"
            className="font-bold"
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#121a2f] text-white min-h-[calc(100vh-64px)]">
      {/* Right-aligned notification system */}
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

      <div className="px-4 mb-8">
        <h1 className="text-3xl font-bold text-white text-center">My Tickets</h1>
      </div>

      {transactions.length === 0 ? (
        renderNoTickets()
      ) : (
        <>
          {/* Active Tickets Section */}
          {activeTransactions.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Active Tickets</h2>
              <div className="px-4">
                <div className="flex flex-wrap justify-center gap-6">
                  {activeTransactions.map((ticket, index) => renderTicketCard(ticket, index))}
                </div>
              </div>
            </div>
          )}

          {/* Cancelled Tickets Section */}
          {cancelledTransactions.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Cancelled Tickets</h2>
              <div className="px-4">
                <div className="flex flex-wrap justify-center gap-6">
                  {cancelledTransactions.map((ticket, index) => renderTicketCard(ticket, index))}
                </div>
              </div>
            </div>
          )}
        </>
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
            
            {detailsLoading ? (
              <div className="py-8 text-center">
                <div className="flex justify-center items-center">
                  <svg className="animate-spin h-6 w-6 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-300">Loading ticket details...</span>
                </div>
              </div>
            ) : (
              <>
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
                
                {ticketDetails[selectedTransaction.transactionID]?.loading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-300">Loading tickets...</p>
                  </div>
                ) : ticketDetails[selectedTransaction.transactionID]?.error ? (
                  <div className="p-4 bg-red-900/30 rounded-lg">
                    <p className="text-red-400">Error: {ticketDetails[selectedTransaction.transactionID].error}</p>
                  </div>
                ) : !ticketDetails[selectedTransaction.transactionID] || 
                   !ticketDetails[selectedTransaction.transactionID].data || 
                   ticketDetails[selectedTransaction.transactionID].data.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-300">No individual tickets found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ticketDetails[selectedTransaction.transactionID].data.map(ticket => (
                      <Card key={ticket.ticketID} className="overflow-hidden bg-[#12203f] border border-blue-900">
                        <div className="p-4">
                          <div className="mb-3 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Section:</span>
                              <span className="text-white text-sm font-medium">{(() => {
                                const seatDetails = parseSeatDetails(ticket.seatID);
                                return seatDetails?.section || 'Unknown';
                              })()}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Seat:</span>
                              <span className="text-white text-sm font-medium">{(() => {
                                const seatDetails = parseSeatDetails(ticket.seatID);
                                return seatDetails?.seat || 'Unknown';
                              })()}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-sm">Tradable:</span>
                              {ticket.tradability ? (
                                ticket.tradability.tradable ? (
                                  <span className="flex items-center text-green-400 text-sm font-medium">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    Verified
                                  </span>
                                ) : (
                                  <span className="flex items-center text-red-400 text-sm font-medium">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                    Not Verified
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-500 text-sm">Checking...</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button
                              className="flex-1 text-sm bg-gray-800 hover:bg-gray-700 text-white border border-blue-700"
                              variant="default"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setShowQRModal(true);
                              }}
                            >
                              Show QR Code
                            </Button>
                            
                            {ticket.status !== 'voided' && ticket.tradability?.tradable && (
                              <Button
                                className={`flex-1 text-sm ${
                                  ticket.listed_for_trade 
                                    ? 'bg-green-600 hover:bg-green-600 cursor-default' 
                                    : 'bg-blue-700 hover:bg-blue-600'
                                } text-white`}
                                variant="default"
                                onClick={() => {
                                  if (!ticket.listed_for_trade) {
                                    setShowDetailsModal(false);
                                    handleListForTrade(ticket);
                                  }
                                }}
                                disabled={ticket.listed_for_trade}
                              >
                                {ticket.listed_for_trade ? 'Listed for Trade' : 'List for Trade'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    variant="default" 
                    className="bg-blue-700 hover:bg-blue-600 text-white"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e24] rounded-lg shadow-lg p-6 max-w-md w-full border border-blue-900">
            <h3 className="text-xl font-bold text-white mb-4 text-center">Ticket QR Code</h3>
            
            <div className="p-4 bg-[#12203f] rounded-lg flex flex-col items-center">
              <p className="text-gray-300 mb-4 text-center">
                {selectedTicket.eventTitle}<br />
                {selectedTicket.eventDate} at {selectedTicket.eventTime}
              </p>
              
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={selectedTicket.ticketID}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/logo192.png",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
              
              <p className="mt-4 text-sm text-gray-400 break-all text-center">
                Ticket ID: {selectedTicket.ticketID}
              </p>
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button 
                variant="default" 
                className="bg-blue-700 hover:bg-blue-600 text-white"
                onClick={() => setShowQRModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && ticketToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e24] rounded-lg shadow-lg p-6 max-w-md w-full border border-blue-900">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Cancellation</h3>
            
            <p className="text-gray-300 mb-4">
              Are you sure you want to cancel your {ticketToCancel.numTickets} ticket(s) for {ticketToCancel.eventTitle}?
            </p>
            
            {ticketToCancel.refundEligible ? (
              <div className="bg-green-900/30 p-3 rounded mb-4">
                <p className="text-green-400">
                  You are eligible for a full refund.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-900/30 p-3 rounded mb-4">
                <p className="text-yellow-400">
                  This ticket is not eligible for a refund, but you can still cancel it.
                </p>
              </div>
            )}
            
            <div className="flex gap-4 mt-6">
              <Button 
                variant="default" 
                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white"
                onClick={() => setShowCancelModal(false)}
              >
                Go Back
              </Button>
              <Button 
                variant="default" 
                className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                onClick={confirmCancellation}
              >
                Confirm Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage; 