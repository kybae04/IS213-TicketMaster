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

    // Cancel a trade request using PATCH
    cancelTradeRequest: async (tradeRequestId, userId) => {
        try {
            console.log('Sending PATCH request to cancel trade request');
            const response = await apiClient.patch('/trade-request/cancel', {
                tradeRequestID: tradeRequestId,
                userID: userId
            });
            console.log('Trade request cancelled:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error cancelling trade request:', error);
            throw error;
        }
    },

    // Accept a trade request using PATCH
    acceptTradeRequest: async (tradeRequestId, acceptingUserId) => {
        try {
            console.log('Sending PATCH request to accept trade request');
            const response = await apiClient.patch('/trade-request/accept', {
                tradeRequestID: tradeRequestId,
                acceptingUserID: acceptingUserId
            });
            console.log('Trade request accepted:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error accepting trade request:', error);
            throw error;
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

