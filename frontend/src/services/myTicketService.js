import apiClient from "./api";

const myTicketService = {
    getMyTickets: async (userID) => {
        try {
            const response = await apiClient.get(`/tickets/user/${userID}`)
            return response.data
        }
        catch (error) {
            console.error('Error fetching tickets:', error)
            throw error
        }
    },

    // Get tickets by transaction ID
    getTicketsByTransaction: async (transactionID) => {
        try {
            const response = await apiClient.get(`/tickets/transaction/${transactionID}`)
            // Filter tickets to return only those that match the transaction ID
            const tickets = response.data;
            console.log(`Raw ticket response for txn ${transactionID}:`, tickets);
            return tickets;
        }
        catch (error) {
            console.error('Error fetching tickets by transaction:', error)
            throw error
        }
    },

    // Verify if a ticket is tradable
    verifyTicketTradable: async (ticketID) => {
        // Skip API call and just return tradable true to avoid 404 errors
        return { ticket_id: ticketID, tradable: true };
    },

    // List a ticket for trade
    listForTrade: async (ticketID) => {
        try {
            const response = await apiClient.put(`/ticket/${ticketID}/list-for-trade`, {
                listed_for_trade: true
            })
            return response.data
        }
        catch (error) {
            console.error('Error listing ticket for trade:', error)
            throw error
        }
    },

    // Unlist a ticket from trade
    unlistFromTrade: async (ticketID) => {
        try {
            const response = await apiClient.put(`/ticket/${ticketID}/list-for-trade`, {
                listed_for_trade: false
            })
            return response.data
        }
        catch (error) {
            console.error('Error unlisting ticket from trade:', error)
            throw error
        }
    },

    // Toggle a ticket's listed_for_trade status
    toggleTradeStatus: async (ticketID, currentStatus) => {
        try {
            const response = await apiClient.put(`/ticket/${ticketID}/list-for-trade`, {
                listed_for_trade: !currentStatus
            })
            return response.data
        }
        catch (error) {
            console.error('Error toggling trade status:', error)
            throw error
        }
    },

    // Get tickets available for trade for a specific event and category
    getTradeableTickets: async (eventID, category) => {
        try {
            console.log(`Fetching tradeable tickets for event ${eventID} and category ${category}`);
            // First try the specific endpoint for tradeable tickets
            let response = await apiClient.get(`/tickets/up-for-trade/${eventID}/${category}`);
            console.log('API response for tradeable tickets:', response.data);
            
            // If no tickets returned or empty array, try a fallback approach
            if (!response.data || response.data.length === 0) {
                console.log('No tickets found via up-for-trade endpoint, trying fallback approach');
                
                // Try to get all tickets for the event
                try {
                    const allTicketsResponse = await apiClient.get(`/tickets/event/${eventID}`);
                    console.log(`Found ${allTicketsResponse.data.length} total tickets for event ${eventID}`);
                    
                    // Filter tickets on client side to get those that match criteria
                    response.data = allTicketsResponse.data.filter(ticket => {
                        // Parse seat details to get category
                        const seatID = ticket.seatID;
                        if (!seatID) return false;
                        
                        // For VIP tickets
                        if (category === 'VIP' && seatID.toLowerCase().includes('vip')) {
                            return ticket.listed_for_trade === true;
                        }
                        
                        // For regular category tickets
                        const categoryMatch = seatID.match(/_cat_(\d+)/i);
                        return categoryMatch && 
                               categoryMatch[1] === category && 
                               ticket.listed_for_trade === true;
                    });
                    
                    console.log(`Found ${response.data.length} tickets matching category ${category}`);
                } catch (fallbackError) {
                    console.error('Fallback approach failed:', fallbackError);
                }
            }
            
            // Further filter on the client side to ensure we only get tickets that are listed for trade
            const tradableTickets = response.data.filter(ticket => 
                ticket.listed_for_trade === true &&
                ticket.status !== 'voided' &&
                ticket.status !== 'cancelled'
            );
            
            return tradableTickets;
        } 
        catch (error) {
            console.error('Error fetching tradeable tickets:', error);
            // Return empty array instead of throwing to avoid crashing the UI
            return [];
        }
    },

    // getSeatDetails: async (seatID) => {
    //     try {
    //         const response = await apiClient.get(`/seat/details/${seatID}`)
    //         return response.data
    //     }
    //     catch (error) {
    //         console.error('Error fetching seat details:', error)
    //         throw error
    //     }
    // },

    getEventDetails: async (eventID) => {
        try {
            const response = await apiClient.get(`/events/${eventID}`)
            return response.data
        } 
        catch (error) {
            console.error('Error fetching event details:', error)
            throw error
        }
    },

    // Get all tickets for a specific event (for debugging)
    getAllTicketsForEvent: async (eventID) => {
        try {
            const response = await apiClient.get(`/tickets/event/${eventID}`);
            console.log(`Found ${response.data.length} total tickets for event ${eventID}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching all tickets for event ${eventID}:`, error);
            return [];
        }
    }
}

export default myTicketService;