import apiClient from './api';

// Cache for events to prevent unnecessary API calls
let cachedEvents = null;

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

// Default image in case an artist isn't found in the map
const DEFAULT_IMAGE = 'taylorswift.webp';

// Use the endpoint URL that works directly in the browser
const EVENTS_API_URL = '/events/';  // This is the URL that works in your browser

const eventService = {
  // Expose the cached events
  get cachedEvents() {
    return cachedEvents;
  },

  /**
   * Check the raw API response directly (for debugging)
   */
  checkRawApiResponse: async () => {
    try {
      console.log('Directly checking raw API response...');
      const response = await apiClient.get(EVENTS_API_URL);
      console.log('Raw API content:', response.data);

      if (response.data && response.data.Events) {
        console.log('Events array sample:', response.data.Events.slice(0, 2));
        return {
          success: true,
          message: 'API appears to be working correctly',
          sampleData: response.data.Events.slice(0, 2)
        };
      } else {
        return {
          success: false,
          message: 'API response does not contain Events array',
          rawResponse: response.data
        };
      }
    } catch (error) {
      console.error('Error checking API:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  },

  /**
   * Fetches all events from the event microservice
   * @returns {Promise<Array>} Array of event objects
   */
  getAllEvents: async () => {
    // Return cached events if available
    if (cachedEvents) {
      console.log('Returning cached events:', cachedEvents.length);
      return cachedEvents;
    }

    try {
      const fullUrl = `${apiClient.defaults.baseURL}${EVENTS_API_URL}`;
      console.log(`Fetching events from API at ${fullUrl}...`);

      const response = await apiClient.get(EVENTS_API_URL);
      console.log('API Response status:', response.status);
      console.log('API Response data:', response.data);

      // Extract events from the response - specifically handling the format:
      // { "Result": { "Success": true, "ErrorMessage": "" }, "Events": [...] }
      let eventsData = [];

      if (response.data && response.data.Events && Array.isArray(response.data.Events)) {
        // This is the exact format from the browser output
        eventsData = response.data.Events;
        console.log('Found events in response.data.Events with', eventsData.length, 'items');
      }
      else if (Array.isArray(response.data)) {
        // Direct array in case the API response format changes
        eventsData = response.data;
        console.log('Response is a direct array with', eventsData.length, 'items');
      }
      else {
        // Try to find any arrays in the response
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            eventsData = response.data[key];
            console.log(`Found events array in response.data.${key} with`, eventsData.length, 'items');
            break;
          }
        }
      }

      if (eventsData.length > 0) {
        console.log('First event in response:', eventsData[0]);

        // Transform the event data to match expected format in the frontend
        const transformedEvents = eventsData.map((event) => {
          console.log('Processing raw event:', event);

          // Get the correct image for this artist
          const artistName = event.Artist;
          const imageFilename = artistImageMap[artistName] || DEFAULT_IMAGE;
          const imagePath = `/events/${imageFilename}`;

          // Note: For the events list, we use placeholder pricing
          // The actual detailed pricing will be fetched when viewing a specific event
          const placeholderPrices = {
            VIP: 399,
            CAT1: 299,
            CAT2: 199,
            CAT3: 99
          };

          // Create a properly formatted event object with exact values from API
          const transformedEvent = {
            id: parseInt(event.EventId, 10),
            title: event.Artist,
            date: event.EventDate,
            time: event.EventTime ? event.EventTime.substring(0, 5) : '',
            location: 'Stadium SG', // Only use this as fallback since API doesn't provide venue
            image: imagePath,
            description: `Join us for an unforgettable concert featuring ${event.Artist}!`,
            category: 'Concert',
            // Use placeholder prices for list view - detailed prices are fetched on event details page
            price: placeholderPrices,
            // Note: Available seats will be fetched from a separate inventory microservice
            // This is a placeholder until the microservice integration is complete
            // Keep original data for reference
            EventId: parseInt(event.EventId, 10)
          };

          console.log(`Transformed event with artist-specific image:`, transformedEvent);
          return transformedEvent;
        });

        console.log('All transformed events:', transformedEvents.length);
        cachedEvents = transformedEvents;
        return transformedEvents;
      }

      console.error('API returned an empty events array or events not found in the response');
      return [];
    } catch (error) {
      console.error('Error fetching events:', error);
      console.log('Returning empty events array');
      return [];
    }
  },

  /**
   * Fetches a specific event by its ID
   * @param {string|number} eventId - The ID of the event to fetch
   * @returns {Promise<Object>} Event object
   */
  getEventById: async (eventId) => {
    // Try to get from cached events first
    if (cachedEvents) {
      const cachedEvent = cachedEvents.find(
        event => (event.id === Number(eventId) || event.EventId === Number(eventId))
      );
      if (cachedEvent) return cachedEvent;
    }

    try {
      console.log(`Fetching event ${eventId} from API...`);
      // Get the event from the API using the correct route
      const response = await apiClient.get(`${EVENTS_API_URL}${eventId}`);
      console.log(`API Response for event ${eventId}:`, response.data);

      // Extract event from the response
      let eventData = null;
      let categoryData = [];

      // Handle different possible response formats
      if (response.data && response.data.EventResponse) {
        eventData = response.data.EventResponse;
        categoryData = response.data.EventResponse.Category || [];
      }
      else if (response.data && response.data.EventId) {
        // Direct event object with EventId field
        eventData = response.data;
        categoryData = response.data.Category || [];
      }
      else if (response.data && response.data.Result && response.data.Result.Success) {
        // Try to find the event data in the response object
        for (const key in response.data) {
          if (key !== 'Result' && response.data[key] && typeof response.data[key] === 'object') {
            eventData = response.data[key];
            if (eventData.Category) {
              categoryData = eventData.Category;
            }
            break;
          }
        }
      }
      else {
        // Default fallback
        eventData = response.data;
        if (eventData.Category) {
          categoryData = eventData.Category;
        }
      }

      if (eventData) {
        // Get the correct image based on artist name
        const artistName = eventData.Artist;
        const imageFilename = artistImageMap[artistName] || DEFAULT_IMAGE;
        const imagePath = `/events/${imageFilename}`;

        // Process category and price data from API
        const prices = {};

        // Map the categories from API to our frontend category structure
        if (categoryData && categoryData.length > 0) {
          categoryData.forEach(category => {
            // Convert API's category format (cat_1, cat_2, cat_3, vip) to our format (CAT1, CAT2, CAT3, VIP)
            // let categoryKey = '';
            // if (category.CategoryNo === 'vip') {
            //   categoryKey = 'VIP';
            // } else if (category.CategoryNo === 'cat_1') {
            //   categoryKey = 'CAT1';
            // } else if (category.CategoryNo === 'cat_2') {
            //   categoryKey = 'CAT2';
            // } else if (category.CategoryNo === 'cat_3') {
            //   categoryKey = 'CAT3';
            // }

            // if (category.CategoryNo) {
            prices[category.CategoryNo] = Number(category.Price);
            // }
          });
        } else {
          // Only use fallback prices if no categories found in API
          console.warn('No category data found in API response, using fallback prices');
          prices.vip = 399;
          prices.cat_1 = 299;
          prices.cat_2 = 199;
          prices.cat_3 = 99;
        }

        // Transform the event data to match frontend expectations
        const transformedEvent = {
          id: parseInt(eventData.EventId, 10) || parseInt(eventId, 10) || 1,
          title: eventData.Artist,
          date: eventData.EventDate,
          time: eventData.EventTime ? eventData.EventTime.substring(0, 5) : '',
          location: 'Stadium SG',
          image: imagePath,
          description: `Join us for an unforgettable concert featuring ${eventData.Artist}!`,
          category: 'Concert',
          price: prices,
          // Store the raw category data for later use
          rawCategoryData: categoryData,
          // Note: Available seats will be fetched from a separate inventory microservice
          // This is intentionally omitted until the microservice integration is complete
          // Keep original EventId field as well
          EventId: parseInt(eventData.EventId, 10) || parseInt(eventId, 10) || 1
        };

        console.log('Transformed single event with API pricing:', transformedEvent);
        return transformedEvent;
      }

      throw new Error(`Event with ID ${eventId} not found in API response`);
    } catch (error) {
      console.error(`Error fetching event with ID ${eventId}:`, error);

      // If we already fetched all events, try to find it there as a fallback
      if (!cachedEvents) {
        await eventService.getAllEvents();

        if (cachedEvents) {
          const cachedEvent = cachedEvents.find(
            event => (event.id === Number(eventId) || event.EventId === Number(eventId))
          );
          if (cachedEvent) return cachedEvent;
        }
      }

      throw new Error(`Event with ID ${eventId} not found`);
    }
  },

  /**
   * Clears the event cache
   */
  clearCache: () => {
    cachedEvents = null;
    console.log('Event cache cleared');
  }
};

export default eventService;