import apiClient from "./api";

const cancelService = {
  verifyRefundEligibility: async (eventID, userID) => {
    try {
        const response = await apiClient.get(`/refund-eligibility/${eventID}?userID=${userID}`);
        return response.data;
    } catch (error) {
        console.error(`Error verifying ticket tradability for eventID ${eventID}:`, error);
        throw error;
    }
  },


  // cancelTicket: async (txnID) => {
  //   try {
  //       const response = await apiClient.post(`cancel/${txnID}`)
  //       return response.data
  //   } catch (error) {
  //       console.error(`Error cancelling ticket with txn_id ${txnID}:`, error);
  //       throw error;
  //   }
  // }
  cancelTicket: async (txnID, refundEligibility) => {
    try {
      const response = await apiClient.post(`/cancel/${txnID}`, {
        refund_eligibility: refundEligibility
      });
      return response.data;
    } catch (error) {
      console.error(`Error cancelling ticket with txn_id ${txnID}:`, error);
      throw error;
    }
  }
  
}

export default cancelService;