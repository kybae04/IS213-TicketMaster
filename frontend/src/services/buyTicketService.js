import apiClient from "./api";

const buyTicketService = {
    getAvailabilityByCat: async (eventID, categoryID) => {
        try {
            const response = await apiClient.get(`/availability/${eventID}/${categoryID}`);
            const numSeats = response.data.count
            return numSeats;
        } catch (error) {
            console.error(`Error fetching availability for event ${eventID} and category ${categoryID}:`, error);
            throw error;
        }
    },

    lockTicket: async (eventID, categoryID, userID, quantity) => {
        try {
            const response = await apiClient.post(`/lock/${eventID}/${categoryID}`, {
                userID: userID,
                quantity: quantity
            });
            return response.data;
        }
        catch (error) {
            console.error(`Error locking ticket for event ${eventID} and category ${categoryID}:`, error);
            throw error;
        }
    },

    confirmPayment: async (eventID, categoryID, userID, quantity) => {
        try {
            const response = await apiClient.post(`/purchase/${eventID}/${categoryID}`, {
                userID: userID,
                quantity: quantity,
                source: 'tok_visa'
            });
            return response.data;
        } catch (error) {
            console.error(`Error confirming payment for event ${eventID} and category ${categoryID}:`, error);
            throw error;
        }
    },

    timeout: async (eventID, categoryID, userID) => {
        try {
            const response = await apiClient.post(`/timeout/${eventID}/${categoryID}`, {
                userID: userID
            }); 
            return response.data;
        } catch (error) {
            console.error(`Error handling timeout for event ${eventID} and category ${categoryID}:`, error);
            throw error;
        }
    }

}

export default buyTicketService;