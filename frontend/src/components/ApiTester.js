import React, { useState, useEffect } from 'react';
import testApiConnection from '../utils/testApiConnection';
import eventService from '../services/eventService';
import ApiDebugger from './ApiDebugger';

/**
 * Component for testing API connection
 * Add this temporarily to diagnose API issues
 */
const ApiTester = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [dataSource, setDataSource] = useState('No Data');
  const [lastResponse, setLastResponse] = useState(null);
  const [showDebugger, setShowDebugger] = useState(false);

  // Check what type of data we're using initially
  useEffect(() => {
    checkDataSource();
  }, []);

  const checkDataSource = async () => {
    try {
      // Fetch events if not already cached
      if (!eventService.cachedEvents) {
        await eventService.getAllEvents();
      }
      
      // Get a reference to the events to check their structure
      const events = await eventService.getAllEvents();
      
      if (!events || events.length === 0) {
        setDataSource('No Data');
        setEventCount(0);
      } else {
        setDataSource('Real API Data');
        setEventCount(events.length);
        
        // Store one event for display
        if (events[0]) {
          setLastResponse({
            originalFormat: {
              Result: { Success: true, ErrorMessage: "" },
              Events: [{ EventId: events[0].EventId, EventDate: events[0].EventDate, EventTime: events[0].EventTime, Artist: events[0].Artist }]
            },
            transformedEvent: {
              id: events[0].id,
              title: events[0].title,
              image: events[0].image
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking data source:', error);
      setDataSource('Error');
    }
  };

  const runTest = async () => {
    setLoading(true);
    setResults(null);
    try {
      const testResults = await testApiConnection();
      setResults(testResults);
      await checkDataSource();
    } catch (error) {
      console.error('Error running API tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCacheAndTest = async () => {
    setLoading(true);
    setResults(null);
    try {
      // Clear the cache
      eventService.clearCache();
      // Try to get events with the new URL
      await eventService.getAllEvents();
      // Check the data source
      await checkDataSource();
      // Run tests to show updated results
      const testResults = await testApiConnection();
      setResults(testResults);
    } catch (error) {
      console.error('Error clearing cache and testing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg z-50"
        onClick={() => setExpanded(true)}
      >
        API Test
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-auto border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">API Connection Tester</h3>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setExpanded(false)}
        >
          ✕
        </button>
      </div>
      
      <div className="mb-4 text-xs text-gray-600 dark:text-gray-400">
        <div>Currently using: 
          <span className={`font-semibold ${
            dataSource === 'No Data' ? 'text-red-600 dark:text-red-400' : 
            dataSource === 'Error' ? 'text-red-600 dark:text-red-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            {dataSource} {eventCount > 0 && `(${eventCount} events)`}
          </span>
        </div>
        <div className="mt-1">
          {dataSource === 'Real API Data' ? 
            'Successfully loaded real event data from API!' :
            'Test API connections below:'}
        </div>
      </div>
      
      {lastResponse && (
        <div className="mb-4 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
          <div className="font-semibold mb-1">API Data Transformation:</div>
          <div className="text-xs mb-2">
            <div className="font-medium">Original API Format:</div>
            <div className="text-gray-600 dark:text-gray-400 overflow-hidden text-ellipsis">
              {JSON.stringify(lastResponse.originalFormat).slice(0, 100)}...
            </div>
          </div>
          <div className="text-xs">
            <div className="font-medium">Transformed Format:</div>
            <div className="text-green-600 dark:text-green-400">
              {JSON.stringify(lastResponse.transformedEvent).slice(0, 100)}...
            </div>
          </div>
        </div>
      )}
      
      <div className="flex gap-2 mb-4">
        <button
          className={`flex-1 p-2 rounded-md ${loading ? 'bg-gray-400' : 'bg-blue-600'} text-white`}
          onClick={runTest}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Connections'}
        </button>
        
        <button
          className={`flex-1 p-2 rounded-md ${loading ? 'bg-gray-400' : 'bg-green-600'} text-white`}
          onClick={clearCacheAndTest}
          disabled={loading}
        >
          Clear Cache & Test
        </button>
      </div>
      
      <button
        className="w-full mb-4 p-2 rounded-md bg-yellow-600 text-white"
        onClick={() => setShowDebugger(!showDebugger)}
      >
        {showDebugger ? 'Hide Advanced Debugger' : 'Show Advanced Debugger'}
      </button>
      
      {showDebugger && <ApiDebugger />}
      
      {results && (
        <div className="text-sm">
          <h4 className="font-semibold mb-2">Results:</h4>
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            {results.map((result, index) => (
              <div key={index} className={`mb-2 p-2 rounded ${result.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <div className="font-semibold mb-1">{result.endpoint}</div>
                <div className={`text-xs ${result.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {result.success ? '✓ Success' : '✗ Failed'} 
                  {result.time && <span className="ml-1">({result.time})</span>}
                </div>
                {result.success && result.data && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {result.data.count ? `${result.data.count} items` : 'Data received'}
                    {result.data.type && (
                      <div className="italic mt-1">Response type: {result.data.type}</div>
                    )}
                  </div>
                )}
                {!result.success && (
                  <div className="text-xs text-red-800 dark:text-red-300 mt-1 break-words">
                    {result.error.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTester; 