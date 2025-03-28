import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

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
          },
          {
            id: 'TKT-9876-5432',
            eventTitle: 'NBA Finals 2023: Game 7',
            eventDate: 'June 18, 2023',
            eventTime: '9:00 PM',
            location: 'Madison Square Garden, New York',
            category: 'CAT2',
            section: 'Lower Bowl',
            row: '12',
            seats: ['5', '6', '7'],
            price: 350.00,
            purchaseDate: '2023-05-02',
            status: 'cancelled',
            refundAmount: 350.00,
            refundDate: '2023-05-10',
            qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TKT-9876-5432',
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

  const handleCancelClick = (ticket) => {
    setTicketToCancel(ticket);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    try {
      // In a real app, this would be an API call to cancel the ticket
      /*
      * MICROSERVICE INTEGRATION POINT:
      * 
      * In production, you would call the tickets microservice:
      * const response = await fetch(`https://api-gateway.example.com/tickets/${ticketToCancel.id}/cancel`, {
      *   method: 'POST',
      *   headers: { 
      *     'Content-Type': 'application/json',
      *     Authorization: `Bearer ${token}` 
      *   }
      * });
      */
      
      // For demo purposes, update the local state
      setTickets(tickets.map(ticket => 
        ticket.id === ticketToCancel.id 
          ? { 
              ...ticket, 
              status: 'cancelled',
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
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
              <Card key={ticket.id} className={`overflow-hidden ${ticket.status === 'cancelled' ? 'opacity-70' : ''}`}>
                <div className="relative h-48">
                  <img 
                    src={ticket.eventImage} 
                    alt={ticket.eventTitle} 
                    className="w-full h-full object-cover"
                  />
                  {ticket.status === 'cancelled' && (
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
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      ticket.category === 'VIP' ? 'bg-purple-600 text-white' :
                      ticket.category === 'CAT1' ? 'bg-red-600 text-white' :
                      ticket.category === 'CAT2' ? 'bg-blue-600 text-white' :
                      ticket.category === 'CAT3' ? 'bg-green-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {ticket.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
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
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Ticket ID:</span>
                      <span className="text-gray-900 dark:text-white text-sm font-medium">{ticket.id}</span>
                    </div>
                  </div>
                  
                  {ticket.status === 'cancelled' ? (
                    <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded mb-3">
                      <p className="text-red-700 dark:text-red-400 text-sm font-medium">Cancelled on {ticket.refundDate}</p>
                      <p className="text-red-700 dark:text-red-400 text-sm">Refund: ${ticket.refundAmount.toFixed(2)}</p>
                    </div>
                  ) : (
                    <div className="flex justify-center mb-3">
                      <img 
                        src={ticket.qrCode} 
                        alt="Ticket QR Code" 
                        className="h-32 w-32"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {ticket.status === 'active' && (
                      <>
                        <Button 
                          className="flex-1 font-bold"
                          variant="primary"
                          onClick={() => navigate('/trading', { state: { ticket } })}
                        >
                          Trade
                        </Button>
                        <Button 
                          className="flex-1 font-bold"
                          variant="outline"
                          onClick={() => handleCancelClick(ticket)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {ticket.status === 'cancelled' && (
                      <Button 
                        className="flex-1"
                        variant="default"
                        disabled
                      >
                        Refunded
                      </Button>
                    )}
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