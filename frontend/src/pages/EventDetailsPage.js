import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById } from '../utils/mockEventData';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [seatQuantity, setSeatQuantity] = useState(1);
  
  // Load event data
  useEffect(() => {
    const fetchEvent = () => {
      try {
        const eventData = getEventById(id);
        if (!eventData) {
          throw new Error('Event not found');
        }
        setEvent(eventData);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvent();
  }, [id]);
  
  // Handle seat selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    
    // Generate default seat selection for 1 ticket
    const categoryData = event.availableSeats.find(area => area.area === category);
    if (categoryData && categoryData.quantity > 0) {
      const newSelectedSeats = [`${category}-1`];
      setSelectedSeats(newSelectedSeats);
      setSeatQuantity(1);
    }
  };
  
  const handleQuantityChange = (e) => {
    const quantity = parseInt(e.target.value);
    setSeatQuantity(quantity);
    
    // Generate seat IDs based on the selected quantity
    const categoryData = event.availableSeats.find(area => area.area === selectedCategory);
    if (!categoryData || quantity <= 0 || quantity > categoryData.quantity) return;
    
    const newSelectedSeats = [];
    for (let i = 1; i <= quantity; i++) {
      newSelectedSeats.push(`${selectedCategory}-${i}`);
    }
    setSelectedSeats(newSelectedSeats);
  };
  
  const handleCheckout = () => {
    if (selectedSeats.length === 0 && selectedCategory) {
      // Default to 1 seat if category is selected but no seats
      const newSelectedSeats = [`${selectedCategory}-1`];
      setSelectedSeats(newSelectedSeats);
      setSeatQuantity(1);
    } else if (!selectedCategory) {
      alert('Please select a seating category');
      return;
    }
    
    // Create order data to pass to checkout page
    const orderData = {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      eventImage: event.image,
      selectedCategory,
      selectedSeats: selectedSeats.length > 0 ? selectedSeats : [`${selectedCategory}-1`],
      seatQuantity: selectedSeats.length > 0 ? selectedSeats.length : 1,
      pricePerSeat: event.price[selectedCategory],
      totalPrice: (selectedSeats.length > 0 ? selectedSeats.length : 1) * event.price[selectedCategory],
    };
    
    // Navigate to checkout with the order data
    navigate('/checkout', { state: { orderData } });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <div className="text-xl">Loading event details...</div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[40vh]">
        <div className="text-xl mb-4">Event not found</div>
        <Button onClick={() => navigate('/')}>
          Return to Homepage
        </Button>
      </div>
    );
  }
  
  const totalPrice = seatQuantity * (selectedCategory ? event.price[selectedCategory] : 0);
  const maxAvailableSeats = selectedCategory ? 
    Math.min(8, event.availableSeats.find(area => area.area === selectedCategory)?.quantity || 0) : 0;
  
  // Define categories for display - using the correct categories from mock data
  const categories = ['VIP', 'CAT1', 'CAT2', 'CAT3'];
  
  return (
    <>
      {/* Back button */}
      <button 
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to all events
      </button>
      
      {/* Event Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-1/3">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
        <div className="w-full md:w-2/3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {event.title}
          </h1>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{event.category}</Badge>
            <span className="text-gray-500 dark:text-gray-400">
              {event.date} at {event.time}
            </span>
          </div>
          <div className="text-gray-600 dark:text-gray-300 mb-4">
            <div className="flex items-center gap-1 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {event.location}
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {event.description}
          </p>
        </div>
      </div>
      
      {/* Seat Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Select Your Seats
        </h2>
        
        {/* Price Categories */}
        <div className="flex justify-center gap-4 mb-8">
          {categories.map(category => (
            <div 
              key={category} 
              onClick={() => handleCategorySelect(category)}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-full ${selectedCategory === category ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                </div>
                <div 
                  className={`p-4 w-40 cursor-pointer text-center ${
                  selectedCategory === category 
                    ? 'bg-gray-700 border-2 border-blue-500' 
                    : 'bg-gray-800 border border-gray-700'
                  }`}
                >
                  <div className="uppercase font-bold text-white text-center">{category}</div>
                  <div className="text-blue-400 font-bold text-center">${event.price[category]}.00</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Seat Map - Stadium Layout */}
        <div className="w-full max-w-3xl mx-auto mb-16 bg-black py-12 px-8 rounded-lg">
          <div className="relative w-full" style={{ height: "350px" }}>
            <svg
              viewBox="0 0 600 350"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Cat3 - outermost arc */}
              <path
                d="M 50,350 A 250,250 0 0 1 550,350"
                fill={selectedCategory === 'CAT3' ? 'rgba(34, 197, 94, 0.8)' : 'transparent'}
                stroke="#4338ca"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleCategorySelect('CAT3')}
              />
              
              {/* Cat2 */}
              <path
                d="M 100,350 A 200,200 0 0 1 500,350"
                fill={selectedCategory === 'CAT2' ? 'rgba(37, 99, 235, 0.8)' : 'black'}
                stroke="#4338ca"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleCategorySelect('CAT2')}
              />
              
              {/* Cat1 */}
              <path
                d="M 150,350 A 150,150 0 0 1 450,350"
                fill={selectedCategory === 'CAT1' ? 'rgba(220, 38, 38, 0.8)' : 'black'}
                stroke="#4338ca"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleCategorySelect('CAT1')}
              />
              
              {/* VIP - innermost arc before stage */}
              <path
                d="M 200,350 A 100,100 0 0 1 400,350"
                fill={selectedCategory === 'VIP' ? 'rgba(147, 51, 234, 0.8)' : 'black'}
                stroke="#4338ca"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleCategorySelect('VIP')}
              />
              
              {/* Stage - Always black */}
              <path
                d="M 250,350 A 50,50 0 0 1 350,350"
                fill="black"
                stroke="#4338ca"
                strokeWidth="2"
              />
              
              {/* Text labels */}
              <text x="300" y="335" textAnchor="middle" fill="#a5b4fc" fontWeight="bold" fontSize="16">STAGE</text>
              <text x="300" y="280" textAnchor="middle" fill="#a5b4fc" fontWeight="bold" fontSize="14">VIP</text>
              <text x="300" y="230" textAnchor="middle" fill="#a5b4fc" fontWeight="bold" fontSize="14">CAT1</text>
              <text x="300" y="180" textAnchor="middle" fill="#a5b4fc" fontWeight="bold" fontSize="14">CAT2</text>
              <text x="300" y="130" textAnchor="middle" fill="#a5b4fc" fontWeight="bold" fontSize="14">CAT3</text>
            </svg>
          </div>
        </div>
        
        {/* Seat Quantity Selection */}
        {selectedCategory && (
          <div className="max-w-md mx-auto bg-gray-800 border border-blue-500 p-6 rounded mb-8">
            <h3 className="text-lg font-medium text-white mb-4">
              Select Number of Seats - {selectedCategory}
            </h3>
            
            <div className="mb-4">
              <label htmlFor="seatQuantity" className="block text-sm font-medium text-gray-300 mb-1">
                Number of seats (max 8 per order)
              </label>
              <select
                id="seatQuantity"
                value={seatQuantity}
                onChange={handleQuantityChange}
                className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 w-full"
              >
                {[...Array(maxAvailableSeats)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? 'seat' : 'seats'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-blue-400 font-medium mb-1">
              Price per ticket: ${event.price[selectedCategory]}
            </div>
            <div className="text-lg font-bold text-blue-400 mb-4">
              Total: ${totalPrice}
            </div>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold" 
              disabled={seatQuantity <= 0}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
        
        {!selectedCategory && (
          <div className="bg-gray-800 border border-blue-500 p-4 rounded-lg mb-8 text-center">
            <p className="text-blue-400">
              Please select a seating category from the map above.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default EventDetailsPage; 