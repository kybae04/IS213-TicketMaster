import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

function PaymentConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderData, confirmationNumber } = location.state || {};
  
  // Fallback data if state is missing
  const eventData = orderData || {
    eventTitle: 'Event Name',
    eventDate: 'Event Date',
    eventTime: 'Event Time',
    total: 0,
    seatCount: 0,
    category: 'Category'
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3">
            <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Payment Confirmed!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Your tickets have been successfully purchased and are now available in your account.
        </p>

        {confirmationNumber && (
          <div className="text-center mb-4">
            <span className="text-gray-600 dark:text-gray-400">Confirmation Number:</span>
            <span className="font-bold text-gray-800 dark:text-white ml-2">{confirmationNumber}</span>
          </div>
        )}
        
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Order Details</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Event:</span>
              <span className="font-medium text-gray-800 dark:text-white">{eventData.eventTitle}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date:</span>
              <span className="font-medium text-gray-800 dark:text-white">{eventData.eventDate} at {eventData.eventTime}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tickets:</span>
              <span className="font-medium text-gray-800 dark:text-white">{eventData.seatCount} x {eventData.category}</span>
            </div>
            
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">${eventData.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate('/my-tickets')}
            variant="primary"
            className="w-full font-semibold"
          >
            View My Tickets
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-semibold"
          >
            Back to Events
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaymentConfirmationPage; 