import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEvents } from '../context/EventContext';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import SimpleSparkles from '../components/ui/SimpleSparkles';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../components/ui/carousel';

function HomePage() {
  // Get events data and functions from context
  const { events, loading, error, fetchEvents } = useEvents();
  
  // Fetch events when component mounts
  useEffect(() => {
    console.log('HomePage: Fetching events...');
    fetchEvents();
  }, [fetchEvents]); // fetchEvents is now stabilized with useCallback

  // Debug: Log events when they change
  useEffect(() => {
    console.log('HomePage: Events updated:', events);
    console.log('HomePage: Events type:', typeof events);
    console.log('HomePage: Is Array?', Array.isArray(events));
    if (Array.isArray(events)) {
      console.log('HomePage: Events length:', events.length);
      if (events.length > 0) {
        console.log('HomePage: First event:', events[0]);
      }
    }
  }, [events]);

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return 'From $99';
    
    if (typeof price === 'object') {
      // Return the lowest price if price is an object with multiple tiers
      const prices = Object.values(price).filter(p => typeof p === 'number' && !isNaN(p));
      if (prices.length === 0) return 'From $99';
      return `From $${Math.min(...prices)}`;
    }
    
    if (typeof price === 'number' && !isNaN(price)) {
      return `$${price}`;
    }
    
    return 'From $99'; // Default fallback
  };
  
  // Handle loading state
  if (loading) {
    console.log('HomePage: Loading state is true');
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    console.log('HomePage: Error state:', error);
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="text-red-500 text-xl mb-4">Error loading events</div>
        <Button onClick={() => fetchEvents()}>Try Again</Button>
      </div>
    );
  }
  
  // Make sure events is always an array to prevent mapping errors
  const eventsArray = Array.isArray(events) ? events : [];
  console.log('HomePage: Events array after check:', eventsArray);
  console.log('HomePage: Events array length:', eventsArray.length);
  
  const renderEventCard = (event) => {
    console.log('HomePage: Rendering event card for:', event);
    // Skip rendering if event is missing
    if (!event) {
      console.log('HomePage: Skipping null event');
      return null;
    }
    
    // Skip rendering if id is missing (essential for routing)
    if (!event.id && event.id !== 0) {
      console.log('HomePage: Event missing id:', event);
      return null;
    }
    
    return (
      <CarouselItem key={event.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
        <Link to={`/event/${event.id}`} className="block h-full">
          <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="relative w-full h-48 overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <Badge
                className="absolute top-3 right-3 font-medium bg-purple-600 text-white"
              >
                {event.category}
              </Badge>
            </div>
            <div className="p-4 pb-2">
              <h3 className="text-lg line-clamp-1 font-semibold">{event.title}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {event.location}
              </div>
            </div>
            <div className="p-4 pt-0">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar">
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                {event.date} {event.time && `at ${event.time}`}
              </div>
            </div>
            <div className="p-4 pt-0 flex justify-between items-center">
              <span className="font-bold text-gray-900 dark:text-white">
                {formatPrice(event.price)}
              </span>
              <Button 
                asChild
                variant="primary"
                className="px-4 py-2 text-sm"
              >
                <Link 
                  to={`/event/${event.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1"
                >
                  Get Tickets
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </Link>
              </Button>
            </div>
          </Card>
        </Link>
      </CarouselItem>
    );
  };
  
  return (
    <>
      <section className="relative mb-16 h-[300px] md:h-[400px] overflow-hidden rounded-lg">
        <SimpleSparkles 
          particleColor="#5D87FF"
          particleCount={70}
          minSize={0.6}
          maxSize={1.2}
          speed={0.5}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 animate-fade-in">
            TicketMaster
            <span className="ml-2 relative inline-block animate-pulse-slow">
              <span className="text-blue-400 glow-text">2.0</span>
            </span>
          </h1>
        </div>
        <style jsx="true">{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slowPulse {
            0% { opacity: 0.8; }
            50% { opacity: 1; }
            100% { opacity: 0.8; }
          }
          
          .animate-fade-in {
            animation: fadeIn 1.5s ease-out forwards;
          }
          
          .animate-pulse-slow {
            animation: slowPulse 3s infinite;
          }
          
          .glow-text {
            text-shadow: 0 0 10px rgba(96, 165, 250, 0.7),
                         0 0 20px rgba(96, 165, 250, 0.5),
                         0 0 30px rgba(96, 165, 250, 0.3);
          }
        `}</style>
      </section>

      <section className="mb-16">
        <div className="flex items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            All Events
          </h2>
        </div>
        
        <div className="relative px-8">
          {eventsArray.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full relative">
              <CarouselContent className="-ml-4">
                {eventsArray.map(renderEventCard)}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            <div className="text-center p-8 text-gray-500">
              No events available at the moment.
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Discover Events</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Find upcoming concerts, sports events, theater shows, and more.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Secure Tickets</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Purchase tickets safely with our secure checkout process.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Manage Events</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Keep track of your tickets and upcoming events in one place.
          </p>
        </div>
      </section>
    </>
  );
}

export default HomePage; 