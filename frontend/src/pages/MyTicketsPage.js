import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useMyTickets } from '../context/myTicketsContext';
import { useCancel } from '../context/cancelContext';

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
  // Default image in case an artist isn't found in the map
  const DEFAULT_IMAGE = 'taylorswift.webp';
  
  // Get the image filename for this artist
  const imageFilename = artistImageMap[artistName] || DEFAULT_IMAGE;
  return `/events/${imageFilename}`;
};

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const { transactions, fetchGroupedTickets, loading, error } = useMyTickets();
  const { checkRefundEligibility, cancelTicket } = useCancel();

  useEffect(() => {
    fetchGroupedTickets();
  }, [fetchGroupedTickets]);

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
      }))

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <p>Loading your tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 h-[calc(100vh-64px)] flex flex-col justify-start items-center" style={{ paddingTop: '15vh' }}>
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">My Tickets</h1>

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

  // Single ticket display for a cleaner UI when there's only one ticket
  const singleTicket = transactions.length === 1 ? transactions[0] : null;

  return (
    <div className="container mx-auto px-4 h-[calc(100vh-64px)] flex flex-col justify-start items-center" style={{ paddingTop: '15vh' }}>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">My Tickets</h1>

      <div className="w-full overflow-auto flex justify-center" style={{ maxHeight: 'calc(100vh - 160px)' }}>
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-md w-full">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No tickets found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Browse events and purchase tickets to see them here.</p>
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
        ) : singleTicket ? (
          // Single ticket display centered in the page
          <Card className={`overflow-hidden max-w-md w-full ${singleTicket.status === 'voided' ? 'opacity-70' : ''}`}>
            <div className="relative h-48">
              <img
                src={getEventImage(singleTicket.eventTitle)}
                alt={singleTicket.eventTitle}
                className="w-full h-full object-cover"
              />
              {singleTicket.status === 'voided' && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="bg-red-600 text-white px-4 py-2 rounded-md font-bold uppercase">
                    Cancelled
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{singleTicket.eventTitle}</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                {singleTicket.eventDate} at {singleTicket.eventTime}
              </p>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Number of Tickets:</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">{singleTicket.numTickets}</span>
                </div>
              </div>

              {singleTicket.status === 'voided' ? (
                <div>
                  <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded mb-3">
                    <p className="text-center text-red-700 dark:text-red-400 text-lg font-bold">Refunded</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 font-bold"
                    variant="default"
                    onClick={() => handleCancelClick(singleTicket)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          // Multiple tickets display
          <div className="space-y-6 max-w-5xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {transactions.map((ticket) => (
                <Card key={ticket.id} className={`overflow-hidden ${ticket.status === 'voided' ? 'opacity-70' : ''}`}>
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
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.eventTitle}</h3>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                      {ticket.eventDate} at {ticket.eventTime}
                    </p>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500 dark:text-gray-400 text-sm">Number of Tickets:</span>
                        <span className="text-gray-900 dark:text-white text-sm font-medium">{ticket.numTickets}</span>
                      </div>
                    </div>

                    {ticket.status === 'voided' ? (
                      <div>
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded mb-3">
                          <p className="text-center text-red-700 dark:text-red-400 text-lg font-bold">Refunded</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 font-bold"
                          variant="default"
                          onClick={() => handleCancelClick(ticket)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Cancellation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-center">
              Are you sure you want to cancel your ticket for "<span className="font-medium">{ticketToCancel?.eventTitle}</span>"?
              {ticketToCancel?.refundEligible
                ? " You will receive a full refund."
                : " You will NOT be able to receive any refund."}
            </p>
            <div className="flex gap-4 justify-end">
              <Button
                onClick={() => setShowCancelModal(false)}
                variant="outline"
                className="font-medium"
              >
                Keep Ticket
              </Button>
              <Button
                onClick={confirmCancellation}
                variant="default"
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Yes, Cancel Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage; 