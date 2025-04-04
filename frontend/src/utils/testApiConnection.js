import axios from 'axios';

/**
 * This utility helps diagnose API connection issues
 * by attempting different URLs and configurations
 */
export const testApiConnection = async () => {
  const endpoints = [
    // Test direct connection
    { url: 'http://localhost:8000/ESDProject/rest/EventAPI', timeout: 3000, name: 'Direct Kong API' },
    // Test relative path with proxy
    { url: '/ESDProject/rest/EventAPI', timeout: 3000, name: 'Proxy Kong API' },
    // Try with different proxy
    { url: '/events', timeout: 3000, name: 'Simple Endpoint' }, 
    // Try mock data endpoint
    { testMock: true, name: 'Mock Data' }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      if (endpoint.testMock) {
        // Test mock data import
        const { events } = await import('../utils/mockEventData');
        results.push({
          endpoint: 'Mock Data',
          success: true,
          status: 200,
          data: { count: events.length, sample: events.slice(0, 2) }
        });
        continue;
      }

      // Configure request based on endpoint settings
      const config = { 
        timeout: endpoint.timeout || 3000
      };
      
      // Handle start time for timing information
      const startTime = Date.now();
      
      // Make the request
      const response = await axios.get(endpoint.url, config);
      
      // Calculate request time
      const requestTime = Date.now() - startTime;
      
      results.push({
        endpoint: endpoint.name || endpoint.url,
        success: true,
        status: response.status,
        time: `${requestTime}ms`,
        data: response.data
      });
    } catch (error) {
      results.push({
        endpoint: endpoint.name || (typeof endpoint === 'string' ? endpoint : endpoint.url),
        success: false,
        time: error.code === 'ECONNABORTED' ? 'Timeout' : 'Failed',
        error: {
          message: error.message,
          code: error.code,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText
          } : null
        }
      });
    }
  }

  // Log the results in a nicely formatted table
  console.table(results.map(r => ({
    endpoint: r.endpoint,
    success: r.success,
    status: r.success ? r.status : (r.error.response?.status || 'N/A'),
    time: r.time || 'N/A',
    message: r.success ? 'OK' : r.error.message
  })));

  return results;
};

export default testApiConnection; 