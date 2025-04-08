import apiClient from "./api";

const tradeService = {
    // Create a trade request
    createTradeRequest: async (requestData) => {
        try {
            const response = await apiClient.post('/trade-request', requestData);
            console.log('Trade request created:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating trade request:', error);
            throw error;
        }
    },

    // Get pending trade requests for a user
    getPendingTradeRequests: async (userId) => {
        try {
            const response = await apiClient.get(`/trade-requests/${userId}`);
            console.log('Pending trade requests:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching pending trade requests:', error);
            return [];
        }
    },

    // Cancel a trade request - using GET with action parameter
    cancelTradeRequest: async (tradeRequestId) => {
        try {
            // Using GET with query parameters instead of PATCH
            console.log('Attempting GET request to cancel trade request');
            const response = await apiClient.get(`/trade-request/cancel?tradeRequestID=${tradeRequestId}`);
            console.log('Trade request cancelled:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error cancelling trade request:', error);
            
            // If that fails, try alternative approach with a different endpoint
            try {
                console.log('Trying alternative endpoint for cancel');
                const response = await apiClient.get(`/trade-requests/cancel?id=${tradeRequestId}`);
                console.log('Trade request cancelled (alternative):', response.data);
                return response.data;
            } catch (altError) {
                console.error('Alternative endpoint also failed:', altError);
                throw altError;
            }
        }
    },

    // Accept a trade request - using GET with action parameter
    acceptTradeRequest: async (tradeRequestId) => {
        try {
            // Using GET with query parameters instead of PATCH
            console.log('Attempting GET request to accept trade request');
            const response = await apiClient.get(`/trade-request/accept?tradeRequestID=${tradeRequestId}`);
            console.log('Trade request accepted:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error accepting trade request:', error);
            
            // If that fails, try alternative approach with a different endpoint
            try {
                console.log('Trying alternative endpoint for accept');
                const response = await apiClient.get(`/trade-requests/accept?id=${tradeRequestId}`);
                console.log('Trade request accepted (alternative):', response.data);
                return response.data;
            } catch (altError) {
                console.error('Alternative endpoint also failed:', altError);
                throw altError;
            }
        }
    },
    
    // Get ticket details by ticket ID
    getTicketDetails: async (ticketId) => {
        try {
            const response = await apiClient.get(`/ticket/${ticketId}`);
            console.log('Ticket details:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching ticket details:', error);
            throw error;
        }
    }
};

export default tradeService; 

