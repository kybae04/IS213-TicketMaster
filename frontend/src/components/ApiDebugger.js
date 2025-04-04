import React, { useState } from 'react';
import eventService from '../services/eventService';
import { Button } from './ui/button';

const ApiDebugger = () => {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Always clear the cache before checking to ensure a fresh call
      eventService.clearCache();
      console.log('Cache cleared, making fresh API call...');
      
      const result = await eventService.checkRawApiResponse();
      setApiResponse(result);
      
      // Success message but no page refresh
      if (result.success) {
        console.log('API check successful, data available for inspection');
      }
    } catch (err) {
      setError(err.message || 'Error checking API');
    } finally {
      setLoading(false);
    }
  };

  const clearEventCache = () => {
    eventService.clearCache();
    alert('Event cache cleared. Refresh the page to fetch fresh data.');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4">API Debugger</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <Button 
          onClick={checkApi}
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Checking...' : 'Check API Connection'}
        </Button>
        <Button 
          onClick={clearEventCache}
          variant="destructive"
        >
          Clear Event Cache
        </Button>
        <Button 
          onClick={() => window.location.reload()}
          variant="secondary"
        >
          Refresh Page
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-md mb-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {apiResponse && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">API Response</h3>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-80">
            <pre className="text-sm">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
          
          {apiResponse.sampleData && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">Sample Event Data</h3>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-80">
                <pre className="text-sm">
                  {JSON.stringify(apiResponse.sampleData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiDebugger; 