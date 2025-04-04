import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventService from '../services/eventService';
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
  
  // Temporary placeholder availableSeats until inventory microservice is integrated
  const placeholderAvailableSeats = [
    { area: "VIP", quantity: 20 },
    { area: "CAT1", quantity: 50 },
    { area: "CAT2", quantity: 100 },
    { area: "CAT3", quantity: 200 }
  ];
  
  // Load event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log(`Fetching event with ID: ${id}`);
        const eventData = await eventService.getEventById(id);
        console.log('Fetched event data:', eventData);
        
        // Log the raw category data from API if it exists
        if (eventData.rawCategoryData) {
          console.log('Raw category data from API:', eventData.rawCategoryData);
          console.log('Prices from API:', eventData.price);
        } else {
          console.warn('No raw category data found in event - using default pricing');
        }
        
        if (!eventData) {
          throw new Error('Event not found');
        }
        
        // Add placeholder availableSeats data to the event object
        // This will be replaced with real data from inventory microservice
        eventData.availableSeats = placeholderAvailableSeats;
        
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
    // Note: In a real implementation, this would check availability from inventory microservice
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
  
  // Define categories for display - using the categories from the API data if available
  const categories = event.rawCategoryData 
    ? ['VIP', 'CAT1', 'CAT2', 'CAT3'] // Use our standard category names for display
    : ['VIP', 'CAT1', 'CAT2', 'CAT3']; // Fallback to standard categories
  
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
                <div className={`w-10 h-10 rounded-full border-2 ${
                  category === 'VIP' ? 'border-purple-500' : 
                  category === 'CAT1' ? 'border-red-500' : 
                  category === 'CAT2' ? 'border-blue-500' : 
                  'border-green-500'
                } flex items-center justify-center`}>
                  <div className={`w-6 h-6 rounded-full ${
                    selectedCategory === category ? 
                    (category === 'VIP' ? 'bg-purple-500' : 
                    category === 'CAT1' ? 'bg-red-500' : 
                    category === 'CAT2' ? 'bg-blue-500' : 
                    'bg-green-500') : 'bg-transparent'
                  }`}></div>
                </div>
                <div 
                  className={`p-4 w-40 cursor-pointer text-center ${
                  selectedCategory === category 
                    ? `bg-gray-700 border-2 ${
                        category === 'VIP' ? 'border-purple-500' : 
                        category === 'CAT1' ? 'border-red-500' : 
                        category === 'CAT2' ? 'border-blue-500' : 
                        'border-green-500'
                      }`
                    : 'bg-gray-800 border border-gray-700'
                  }`}
                >
                  <div className="uppercase font-bold text-white text-center">{category}</div>
                  <div className={`font-bold text-center ${
                    category === 'VIP' ? 'text-purple-400' : 
                    category === 'CAT1' ? 'text-red-400' : 
                    category === 'CAT2' ? 'text-blue-400' : 
                    'text-green-400'
                  }`}>${event.price[category]}.00</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Seat Map - Stadium Layout */}
        <div className="w-full max-w-4xl mx-auto mb-16 bg-black py-16 px-12 rounded-2xl border-2 border-blue-500 shadow-glow">
          <div className="relative w-full" style={{ height: "450px" }}>
            <svg
              viewBox="0 0 600 400"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Cat3 - outermost arc */}
              <path
                d="M 10,320 A 290,290 0 0 1 590,320"
                fill={selectedCategory === 'CAT3' ? 'rgba(34, 197, 94, 0.8)' : 'transparent'}
                stroke="#4338ca"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleCategorySelect('CAT3')}
              />
              
              {/* Cat2 */}
              <path
                d="M 80,320 A 220,220 0 0 1 520,320"
                fill={selectedCategory === 'CAT2' ? 'rgba(37, 99, 235, 0.8)' : 'black'}
                stroke="#4338ca"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleCategorySelect('CAT2')}
              />
              
              {/* Cat1 */}
              <path
                d="M 150,320 A 150,150 0 0 1 450,320"
                fill={selectedCategory === 'CAT1' ? 'rgba(220, 38, 38, 0.8)' : 'black'}
                stroke="#4338ca"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleCategorySelect('CAT1')}
              />
              
              {/* VIP - innermost arc before stage */}
              <path
                d="M 215,320 A 85,85 0 0 1 385,320"
                fill={selectedCategory === 'VIP' ? 'rgba(147, 51, 234, 0.8)' : 'black'}
                stroke="#4338ca"
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onClick={() => handleCategorySelect('VIP')}
              />
              
              {/* Stage - Always black */}
              <path
                d="M 265,320 A 35,35 0 0 1 335,320"
                fill="black"
                stroke="#4338ca"
                strokeWidth="2"
              />
              
              {/* Text labels */}
              <text x="300" y="312" textAnchor="middle" fill="#a5b4fc" fontWeight="bold" fontSize="14">STAGE</text>
              <text x="300" y="265" textAnchor="middle" fill="#a5b4fc" fontWeight="bold" fontSize="12">VIP</text>
              <text x="300" y="210" textAnchor="middle" fill="#a5b4fc" fontWeight="bold" fontSize="12">CAT1</text>
              <text x="300" y="135" textAnchor="middle" fill="#a5b4fc" fontWeight="bold" fontSize="12">CAT2</text>
              <text x="300" y="70" textAnchor="middle" fill="#a5b4fc" fontWeight="bold" fontSize="12">CAT3</text>
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

      <style jsx="true">{`
        .shadow-glow {
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.5),
                      0 0 30px rgba(37, 99, 235, 0.3);
        }
      `}</style>
    </>
  );
};

export default EventDetailsPage; 