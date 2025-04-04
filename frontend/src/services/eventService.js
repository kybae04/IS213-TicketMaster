import apiClient from './api';
import { events as mockEvents } from '../utils/mockEventData';

// Cache for events to prevent unnecessary API calls
let cachedEvents = null;

const eventService = {
  /**
   * Fetches all events from the event microservice
   * @returns {Promise<Array>} Array of event objects
   */
  getAllEvents: async () => {
    // Return cached events if available
    if (cachedEvents) {
      return cachedEvents;
    }

    try {
      const response = await apiClient.get('/ESDProject/rest/EventAPI');
      cachedEvents = response.data;
      return response.data;
    } catch (error) {
      console.error('Error fetching events, falling back to mock data:', error);
      console.log('Using mock data as fallback');
      // Store mock data in cache to prevent repeated failed requests
      cachedEvents = mockEvents;
      // Fallback to mock data if API fails
      return mockEvents;
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
      const cachedEvent = cachedEvents.find(event => event.id === Number(eventId));
      if (cachedEvent) return cachedEvent;
    }

    try {
      const response = await apiClient.get(`/ESDProject/rest/EventAPI/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event with ID ${eventId}, falling back to mock data:`, error);
      console.log('Using mock data as fallback');
      
      // Ensure we have mockEvents loaded
      if (!cachedEvents) {
        cachedEvents = mockEvents;
      }
      
      // Fallback to mock data if API fails
      const mockEvent = mockEvents.find(event => event.id === Number(eventId));
      if (!mockEvent) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      return mockEvent;
    }
  },
  
  /**
   * Clears the event cache
   */
  clearCache: () => {
    cachedEvents = null;
  }
};

export default eventService;