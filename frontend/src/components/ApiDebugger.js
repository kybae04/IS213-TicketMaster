import React, { useState } from 'react';
import eventService from '../services/eventService';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import myTicketService from '../services/myTicketService';
import supabase from '../supabaseClient';

const ApiDebugger = () => {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ticketResponse, setTicketResponse] = useState(null);
  const [userMappingData, setUserMappingData] = useState(null);
  const { user, backendUserId } = useAuth();

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

  // Debug user ID mapping
  const debugUserMapping = async () => {
    setLoading(true);
    setError(null);
    try {
      // Log current auth state
      console.log("Current auth state:", {
        isAuthenticated: !!user,
        user: user,
        backendUserId: backendUserId,
        userEmail: user?.email,
        userID: user?.id
      });

      // Try to fetch all user mappings
      const { data, error: mappingError } = await supabase
        .from('user_mapping')
        .select('*');
      
      if (mappingError) {
        throw new Error(`Error fetching user mappings: ${mappingError.message}`);
      }
      
      setUserMappingData(data);
      
      // Try to fetch specific user mapping if user is logged in
      if (user?.id) {
        const { data: userMapping, error: userMappingError } = await supabase
          .from('user_mapping')
          .select('backend_user_id')
          .eq('supabase_uid', user.id)
          .single();
          
        if (userMappingError) {
          console.error("Error fetching specific user mapping:", userMappingError);
        } else {
          console.log("Found backend user ID from mapping:", userMapping?.backend_user_id);
        }
      }
      
      // Test with known user IDs
      const testUserIds = ['user_122', 'user_141'];
      const testResults = {};
      
      for (const testId of testUserIds) {
        try {
          console.log(`Testing tickets API with user ID: ${testId}`);
          const ticketsResult = await myTicketService.getMyTickets(testId);
          testResults[testId] = {
            success: true,
            ticketCount: ticketsResult?.length || 0,
            data: ticketsResult
          };
        } catch (err) {
          testResults[testId] = {
            success: false,
            error: err.message
          };
        }
      }
      
      // If backend user ID is available, test with that too
      if (backendUserId) {
        try {
          console.log(`Testing tickets API with backend user ID: ${backendUserId}`);
          const ticketsResult = await myTicketService.getMyTickets(backendUserId);
          testResults[backendUserId] = {
            success: true,
            ticketCount: ticketsResult?.length || 0,
            data: ticketsResult
          };
        } catch (err) {
          testResults[backendUserId] = {
            success: false,
            error: err.message
          };
        }
      }
      
      setTicketResponse({
        userInfo: {
          isAuthenticated: !!user,
          userEmail: user?.email,
          supabaseUserId: user?.id,
          backendUserId: backendUserId
        },
        testResults
      });
      
    } catch (err) {
      setError(err.message || 'Error debugging user mapping');
    } finally {
      setLoading(false);
    }
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
        <Button 
          onClick={debugUserMapping}
          disabled={loading}
          variant="outline"
        >
          Debug User Mapping & Tickets
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-md mb-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {ticketResponse && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">User ID and Tickets Debug Results</h3>
          <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-80">
            <pre className="text-sm">
              {JSON.stringify(ticketResponse, null, 2)}
            </pre>
          </div>
          
          {userMappingData && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">User Mapping Table Data</h3>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-auto max-h-80">
                <pre className="text-sm">
                  {JSON.stringify(userMappingData, null, 2)}
                </pre>
              </div>
            </div>
          )}
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