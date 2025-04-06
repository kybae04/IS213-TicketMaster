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
    }
}

export default myTicketService;