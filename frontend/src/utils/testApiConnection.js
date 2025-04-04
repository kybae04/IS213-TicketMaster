import axios from 'axios';

/**
 * This utility helps diagnose API connection issues
 * by attempting different URLs and configurations
 */
export const testApiConnection = async () => {
  const endpoints = [
    // Test with the Kong route paths per the Kong configuration
    { url: '/events/', timeout: 3000, name: 'Events Collection (Kong)' },
    { url: '/events/1', timeout: 3000, name: 'Single Event (Kong)' },
    // Test direct Kong connection
    { url: 'http://localhost:8000/events/', timeout: 3000, name: 'Direct Kong API' },
    // Test the specific event endpoint pattern
    { url: '/events/1', timeout: 3000, name: 'Event ID Pattern' }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
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
      
      // Process the response data to show meaningful information
      let dataInfo = {};
      
      // Check for different response types and formats
      if (Array.isArray(response.data)) {
        dataInfo = { 
          count: response.data.length, 
          type: 'array'
        };
      } 
      else if (response.data && typeof response.data === 'object') {
        // Look for arrays in the object
        let foundArray = false;
        
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            dataInfo = { 
              count: response.data[key].length, 
              type: `object with array in '${key}'`
            };
            foundArray = true;
            break;
          }
          // Check one level deeper
          if (response.data[key] && typeof response.data[key] === 'object') {
            for (const nestedKey in response.data[key]) {
              if (Array.isArray(response.data[key][nestedKey])) {
                dataInfo = { 
                  count: response.data[key][nestedKey].length, 
                  type: `nested array in '${key}.${nestedKey}'`
                };
                foundArray = true;
                break;
              }
            }
            if (foundArray) break;
          }
        }
        
        if (!foundArray) {
          dataInfo = {
            type: 'object',
            keys: Object.keys(response.data).join(', ')
          };
        }
      }
      // Default for other data types
      else {
        dataInfo = {
          type: typeof response.data,
          preview: JSON.stringify(response.data).slice(0, 100) + (JSON.stringify(response.data).length > 100 ? '...' : '')
        };
      }
      
      results.push({
        endpoint: endpoint.name || endpoint.url,
        success: true,
        status: response.status,
        time: `${requestTime}ms`,
        data: dataInfo
      });
    } catch (error) {
      results.push({
        endpoint: endpoint.name || endpoint.url,
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