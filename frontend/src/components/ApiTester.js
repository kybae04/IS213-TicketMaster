import React, { useState } from 'react';
import testApiConnection from '../utils/testApiConnection';
import { events as mockEvents } from '../utils/mockEventData';

/**
 * Component for testing API connection
 * Add this temporarily to diagnose API issues
 */
const ApiTester = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mockCount, setMockCount] = useState(mockEvents.length);

  const runTest = async () => {
    setLoading(true);
    setResults(null);
    try {
      const testResults = await testApiConnection();
      setResults(testResults);
    } catch (error) {
      console.error('Error running API tests:', error);
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
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-96 max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 z-50">
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
        <div>Currently using: <span className="font-semibold text-green-600 dark:text-green-400">Mock Data ({mockCount} events)</span></div>
        <div className="mt-1">Test different API connection methods:</div>
      </div>
      
      <button
        className={`w-full p-2 rounded-md ${loading ? 'bg-gray-400' : 'bg-blue-600'} text-white mb-4`}
        onClick={runTest}
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test API Connections'}
      </button>
      
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