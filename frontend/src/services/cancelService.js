import apiClient from "./api";

const cancelService = {
    /**
   * Verifies if a ticket is tradable by checking refund eligibility
   * @param {string|number} txnId - The transaction ID of the ticket
   * @returns {Promise<Object>} The response object with refund eligibility
   */
  verifyRefundEligibility: async (txnID) => {
    try {
        const response = await apiClient.get(`/refund-eligibility/${txnID}`);
        return response.data;
    } catch (error) {
        console.error(`Error verifying ticket tradability for txnID ${txnID}:`, error);
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