import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const CancellationSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cancelledTicket, setCancelledTicket] = useState(null);
  
  useEffect(() => {
    // Get cancelled ticket data from navigation state
    if (location.state?.ticket) {
      setCancelledTicket({
        ...location.state.ticket,
        refundAmount: location.state.ticket.price,
        // refundDate: new Date().toLocaleDateString(),
        // estimatedRefundDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
      });
    } else {
      // Redirect to home if no data
      navigate('/my-tickets');
    }
    
    /*
    * MICROSERVICE INTEGRATION POINT:
    * 
    * In a real application with microservices:
    * 1. Confirm cancellation status with the tickets microservice
    * 2. Get refund details from the payments microservice
    * 3. Notify relevant systems (email, notifications)
    * 
    * Example:
    * const fetchCancellationDetails = async () => {
    *   try {
    *     // Get cancellation confirmation
    *     const ticketResponse = await fetch(
    *       `https://api-gateway.example.com/tickets/${ticketId}/status`,
    *       { headers: { Authorization: `Bearer ${token}` } }
    *     );
    *     
    *     // Get refund details
    *     const refundResponse = await fetch(
    *       `https://api-gateway.example.com/payments/refunds?ticketId=${ticketId}`,
    *       { headers: { Authorization: `Bearer ${token}` } }
    *     );
    *     
    *     // Send cancellation confirmation email
    *     await fetch('https://api-gateway.example.com/emails/cancellation', {
    *       method: 'POST',
    *       headers: { 
    *         'Content-Type': 'application/json',
    *         Authorization: `Bearer ${token}`
    *       },
    *       body: JSON.stringify({ ticketId, email: userEmail })
    *     });
    *   } catch (error) {
    *     console.error('Error fetching cancellation details:', error);
    *   }
    * };
    */
    
  }, [location, navigate]);
  
  if (!cancelledTicket) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-xl mb-4">Loading cancellation details...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-green-500 mb-2">
            <svg className="inline-block w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Cancellation Successful
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your ticket has been successfully cancelled and a refund has been initiated.
          </p>
        </div>
        
        <Card className="p-6 mb-6 bg-gray-800 border border-blue-500">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Cancellation Details</h2>
          
          <div className="mb-4">
            {/* <div className="flex justify-between mb-1">
              <span className="text-gray-300">Cancellation Date:</span>
              <span className="text-white font-medium">{cancelledTicket.refundDate}</span>
            </div> */}
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Transaction ID:</span>
              <span className="text-white font-medium">{cancelledTicket.transactionID}</span>
            </div>
          </div>
          
          <div className="border-t border-blue-500/30 my-3"></div>
          
          <h3 className="text-lg font-medium text-white mb-2">{cancelledTicket.eventTitle}</h3>
          <p className="text-gray-300 mb-1">{cancelledTicket.eventDate} at {cancelledTicket.eventTime}</p>
          {/* <p className="text-gray-300 mb-3">{cancelledTicket.location}</p> */}
          
          <div className="border-t border-blue-500/30 my-3"></div>
          
          {/* <div className="flex justify-between mb-1">
            <span className="text-gray-300">Category:</span>
            <span className="text-white font-medium">{cancelledTicket.category}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-300">Section:</span>
            <span className="text-white font-medium">{cancelledTicket.section}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-300">Row:</span>
            <span className="text-white font-medium">{cancelledTicket.row}</span>
          </div> */}
          <div className="flex justify-between mb-1">
            <span className="text-gray-300">Seat(s):</span>
            <span className="text-white font-medium">{cancelledTicket.seatIDs.join(', ')}</span>
          </div>
        </Card>
        
        <Card className="p-6 mb-6 bg-green-800 border border-green-400">
          <h2 className="text-xl font-semibold text-green-300 mb-4">Refund Information</h2>
          
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-green-200">Refund Amount:</span>
              <span className="text-white font-bold">${cancelledTicket.refundAmount}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-green-200">Refund Method:</span>
              <span className="text-white font-medium">Original Payment Method</span>
            </div>
            {/* <div className="flex justify-between mb-1">
              <span className="text-green-200">Estimated Refund Date:</span>
              <span className="text-white font-medium">{cancelledTicket.estimatedRefundDate}</span>
            </div> */}
          </div>
          
          {/* <div className="bg-green-700/50 p-3 rounded mt-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-300 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p className="text-green-200 text-sm">
                  Refunds typically take 3-5 business days to process, depending on your payment provider.
                </p>
              </div>
            </div>
          </div> */}
        </Card>
        
        {/* <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">What's Next?</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="text-blue-500 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Check Your Email</h3>
                <p className="text-gray-600 dark:text-gray-300">We've sent a cancellation confirmation to your email address.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="text-blue-500 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Monitor Your Refund</h3>
                <p className="text-gray-600 dark:text-gray-300">Check your payment method's account for the refund in the next 3-5 business days.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="text-blue-500 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Need Help?</h3>
                <p className="text-gray-600 dark:text-gray-300">If you don't receive your refund within 7 business days, please contact our support team.</p>
              </div>
            </div>
          </div>
        </div> */}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/my-tickets')}
            variant="primary"
            className="font-bold"
          >
            Go to My Tickets
          </Button>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-bold"
          >
            Browse Events
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CancellationSuccessPage; 