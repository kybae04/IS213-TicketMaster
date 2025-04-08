import apiClient from "./api";

// Get current user ID from auth context (imported in components that use this service)
// We don't import AuthContext here to avoid circular dependencies

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

    // Cancel a trade request - using PATCH with correct body structure
    cancelTradeRequest: async (tradeRequestId, userId) => {
        if (!userId) {
            console.error('No userId provided for cancelTradeRequest');
            throw new Error('User ID is required');
        }

        try {
            // Using PATCH with the correct body structure
            console.log('Cancelling trade request with proper PATCH request');
            const response = await apiClient.patch(`/trade-request/cancel`, {
                tradeRequestID: tradeRequestId,
                userID: userId
            });
            console.log('Trade request cancelled:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error cancelling trade request:', error);
            
            // Fallback to older approach if the main one fails
            try {
                console.log('Trying alternative endpoint for cancel');
                const response = await apiClient.get(`/trade-request/cancel?tradeRequestID=${tradeRequestId}`);
                console.log('Trade request cancelled (alternative):', response.data);
                return response.data;
            } catch (altError) {
                console.error('Alternative endpoint also failed:', altError);
                throw altError;
            }
        }
    },

    // Accept a trade request - using PATCH with correct body structure
    acceptTradeRequest: async (tradeRequestId, userId) => {
        if (!userId) {
            console.error('No userId provided for acceptTradeRequest');
            throw new Error('User ID is required');
        }

        try {
            // Using PATCH with the correct body structure
            console.log('Accepting trade request with proper PATCH request');
            const response = await apiClient.patch(`/trade-request/accept`, {
                tradeRequestID: tradeRequestId,
                acceptingUserID: userId
            });
            console.log('Trade request accepted:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error accepting trade request:', error);
            
            // Fallback to older approach if the main one fails
            try {
                console.log('Trying alternative endpoint for accept');
                const response = await apiClient.get(`/trade-request/accept?tradeRequestID=${tradeRequestId}`);
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

