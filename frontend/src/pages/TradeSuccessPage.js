import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { parseSeatDetails, getCategoryName } from '../utils/seatUtils';

const TradeSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tradeData = location.state?.tradeData;

  useEffect(() => {
    // If no trade data in state, create placeholder data
    if (!location.state?.tradeData) {
      console.log("Trade success page opened without trade data");
    }
  }, [location.state]);

  // Handle case where tradeData is missing
  const safeTradeData = tradeData || {
    eventName: "Example Event",
    tradedTickets: {
      ticketID: "example-ticket-123",
      seatID: "E04_D03_cat_1"
    },
    receivedTickets: {
      ticketID: "example-ticket-456",
      seatID: "E04_D05_cat_1"
    },
    tradeDate: new Date().toLocaleDateString()
  };

  // Parse seat details
  const tradedSeatDetails = parseSeatDetails(safeTradeData.tradedTickets.seatID);
  const receivedSeatDetails = parseSeatDetails(safeTradeData.receivedTickets.seatID);

  return (
    <div className="bg-[#121a2f] min-h-[calc(100vh-64px)] container mx-auto px-4 py-8 text-center">
      <div className="max-w-xl mx-auto bg-[#1a2642] p-8 rounded-lg border-2 border-green-500">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Trade Successful!</h1>
        <p className="text-gray-300 text-lg mb-6">
          Your ticket trading request has been successfully processed.
        </p>
        
        <div className="mb-6 bg-[#12203f] p-4 rounded-lg text-left">
          <h2 className="text-xl font-semibold text-blue-400 mb-3">Trade Details</h2>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <p className="text-gray-400 text-sm">Event:</p>
              <p className="text-white font-medium">{safeTradeData.eventName}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Date of Trade:</p>
              <p className="text-white font-medium">{safeTradeData.tradeDate}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 my-3"></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Traded Out:</p>
              <p className="text-white">
                {getCategoryName(tradedSeatDetails?.category)} Ticket
              </p>
              <p className="text-gray-300 text-sm">
                Section {tradedSeatDetails?.section || 'Unknown'}, 
                Row {tradedSeatDetails?.row || 'Unknown'}, 
                Seat {tradedSeatDetails?.seat || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Received:</p>
              <p className="text-white">
                {getCategoryName(receivedSeatDetails?.category)} Ticket
              </p>
              <p className="text-gray-300 text-sm">
                Section {receivedSeatDetails?.section || 'Unknown'}, 
                Row {receivedSeatDetails?.row || 'Unknown'}, 
                Seat {receivedSeatDetails?.seat || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-gray-300 mb-8">
          Your new ticket has been added to your ticket wallet. You can view it in the My Tickets section.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/my-tickets')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            View My Tickets
          </Button>
          <Button 
            onClick={() => navigate('/trading')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
          >
            Trading Platform
          </Button>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="border-white text-white hover:bg-[#12203f]"
          >
            Explore Events
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TradeSuccessPage; 