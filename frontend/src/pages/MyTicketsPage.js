import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
// import axios from 'axios';

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);

  useEffect(() => {
    // Mock fetching tickets data
    const fetchTickets = async () => {
      try {
        // In a real app, this would be an API call
        /*
        * MICROSERVICE INTEGRATION POINT:
        * 
        * In production, you would fetch from the tickets microservice:
        * const response = await fetch('https://api-gateway.example.com/tickets/my-tickets', {
        *   headers: { Authorization: `Bearer ${token}` }
        * });
        * const data = await response.json();
        */

        // For demo purposes, use mock data immediately without loading state
        // // mock data based on endpoints response
        // const mockData = [
        //   {
        //     "eventID": "2",
        //     "seatID": "442055a3-15ec-4c70-981e-d38a7762f679",
        //     "status": "pending_payment",
        //     "ticketID": "1862391e-1a52-4523-a79c-7e60070ee8ae",
        //     "tradeRequestID": "450ee9e8-fdc6-411b-9322-89dca41c5509",
        //     "transactionID": null,
        //     "userID": "user456"
        //   },
        //   {
        //     "eventID": "3",
        //     "seatID": "130c4cf4-7262-411c-a518-dccaced5369e",
        //     "status": "confirmed",
        //     "ticketID": "0576e78f-d7ae-4899-af16-27dc6b5f68ad",
        //     "tradeRequestID": "5cd8df92-ce2e-4bab-9011-3a61994ac82f",
        //     "transactionID": "txn-138509",
        //     "userID": "user456"
        //   },
        //   {
        //     "eventID": "1",
        //     "seatID": "a574d357-c546-4783-a998-115130a886b5",
        //     "status": "confirmed",
        //     "ticketID": "2ba51120-80d2-4b20-af07-68210a271a60",
        //     "tradeRequestID": "95ccc98a-7a4a-4adf-88ab-ad0473d39647",
        //     "transactionID": "txn-120685",
        //     "userID": "user456"
        //   }
        // ]
        const mockTickets = [
          {
            ticketIDs: ['TKT-1234-5678', 'TKT-8765-4321'],
            transactionID: 'txn-123456',
            eventID: "1",
            eventTitle: 'Taylor Swift: The Eras Tour',
            eventDate: 'June 15, 2023',
            eventTime: '7:30 PM',
            numTickets: 2,
            // location: 'MetLife Stadium, New Jersey',
            // category: 'VIP',
            // section: 'A',
            // row: '1',
            // seats: ['12', '13'],
            // price: 450.00,
            // purchaseDate: '2023-04-10',
            status: 'confirmed',
            // qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TKT-1234-5678',
            eventImage: 'https://source.unsplash.com/random/800x500/?concert',
          },
          {
            ticketIDs: ['TKT-1234-5678', 'TKT-8765-4321'],
            transactionID: 'txn-123456',
            eventID: "2",
            eventTitle: 'Coldplay: Music of the Spheres',
            eventDate: 'August 22, 2023',
            eventTime: '8:00 PM',
            numTickets: 2,
            // location: 'Wembley Stadium, London',
            // category: 'CAT1',
            // section: 'B',
            // row: '5',
            // seats: ['22'],
            // price: 180.00,
            // purchaseDate: '2023-05-15',
            status: 'confirmed',
            // qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TKT-8765-4321',
            eventImage: 'https://source.unsplash.com/random/800x500/?music',
          },
          {
            ticketIDs: ['TKT-1234-5678', 'TKT-8765-4321'],
            transactionID: 'txn-123456',
            eventID: "3",
            eventTitle: 'NBA Finals 2023: Game 7',
            eventDate: 'June 18, 2023',
            eventTime: '9:00 PM',
            numTickets: 2,
            // location: 'Madison Square Garden, New York',
            // category: 'CAT2',
            // section: 'Lower Bowl',
            // row: '12',
            // seats: ['5', '6', '7'],
            // price: 350.00,
            // purchaseDate: '2023-05-02',
            status: 'voided',
            // refundAmount: 350.00,
            // refundDate: '2023-05-10',
            // qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TKT-9876-5432',
            eventImage: 'https://source.unsplash.com/random/800x500/?basketball',
          }
        ];

        setTickets(mockTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    fetchTickets();
  }, []);

  // call the refund-eligibility function, then if eligible, show the cancel modal
  const handleCancelClick = (ticket) => {
    setTicketToCancel(ticket);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    try {

      // For demo purposes, update the local state
      setTickets(tickets.map(ticket =>
        ticket.id === ticketToCancel.id
          ? {
            ...ticket,
            status: 'voided',
            refundAmount: ticket.price,
            refundDate: new Date().toISOString().split('T')[0]
          }
          : ticket
      ));

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

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tickets</h1>
        <Button
          onClick={() => navigate('/')}
          variant="primary"
          className="font-bold"
        >
          Find More Events
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
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
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className={`overflow-hidden ${ticket.status === 'voided' ? 'opacity-70' : ''}`}>
                <div className="relative h-48">
                  <img
                    src={ticket.eventImage}
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
                    {/* <span className={`text-xs px-2 py-1 rounded font-medium ${ticket.category === 'VIP' ? 'bg-purple-600 text-white' :
                        ticket.category === 'CAT1' ? 'bg-red-600 text-white' :
                          ticket.category === 'CAT2' ? 'bg-blue-600 text-white' :
                            ticket.category === 'CAT3' ? 'bg-green-600 text-white' :
                              'bg-gray-600 text-white'
                      }`}>
                      {ticket.category}
                    </span> */}
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                    {ticket.eventDate} at {ticket.eventTime}
                  </p>
                  {/* <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    {ticket.location}
                  </p> */}

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                    {/* <div className="flex justify-between mb-1">
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
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Ticket ID:</span>
                      <span className="text-gray-900 dark:text-white text-sm font-medium">{ticket.id}</span>
                    </div> */}
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Number of Tickets:</span>
                      <span className="text-gray-900 dark:text-white text-sm font-medium">2</span> {/* CHANGE LATER, STATIC NOW */}
                    </div>
                  </div>

                  {ticket.status === 'voided' ? (
                    <div>
                      <div className="flex justify-center mb-3"></div>
                      <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded mb-3">
                        <p className="text-center text-red-700 dark:text-red-400 text-lg font-bold">Refunded</p>
                        {/* <p className="text-red-700 dark:text-red-400 text-sm font-medium">Cancelled on {ticket.refundDate}</p>
                      <p className="text-red-700 dark:text-red-400 text-sm">Refund: $100</p>  */}
                        {/* HARDCODED, can choose to either show or dont show this, if show then need to create new route to get refund amount by transactionID in payment service*/}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center mb-3">
                      {/* <img
                        // src={ticket.qrCode} 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.ticketID}`}
                        alt="Ticket QR Code"
                        className="h-32 w-32"
                      /> */}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {ticket.status === 'confirmed' && (
                      <>
                        {/* <Button
                          className="flex-1 font-bold"
                          variant="primary"
                          onClick={() => navigate('/trading', { state: { ticket } })}
                        >
                          Trade
                        </Button> */}
                        <Button
                          className="flex-1 font-bold"
                          variant="default"
                          onClick={() => handleCancelClick(ticket)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {/* {ticket.status === 'voided' && (
                      <Button
                        className="flex-1"
                        variant="default"
                        disabled
                      >
                        Refunded
                      </Button>
                    )} */}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirm Cancellation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to cancel your ticket for "<span className="font-medium">{ticketToCancel?.eventTitle}</span>"? You will receive a refund of ${ticketToCancel?.price.toFixed(2)}.
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