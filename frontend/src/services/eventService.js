import apiClient from './api';

const eventService = {
  /**
   * Fetches all events from the OutSystems event microservice
   * @returns {Promise<Array>} Array of event objects
   */
  getAllEvents: async () => {
    try {
      // If your OutSystems endpoint has a different path structure,
      // adjust the URL path accordingly
      const response = await apiClient.get('/events');
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },
  
  /**
   * Fetches a specific event by its ID
   * @param {string|number} eventId - The ID of the event to fetch
   * @returns {Promise<Object>} Event object
   */
  getEventById: async (eventId) => {
    try {
      const response = await apiClient.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event with ID ${eventId}:`, error);
      throw error;
    }
  }
};

export default eventService;