import React from 'react';
import { useAuth } from '../context/AuthContext';
import useBackendUser from '../hooks/useBackendUser';

/**
 * Component that displays user information including the backend user ID
 */
const UserInfo = () => {
  const { user } = useAuth();
  const { backendUserId, loading, error } = useBackendUser();

  if (!user) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-md text-white">
        <p>Please log in to see your user information.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md text-white">
      <h2 className="text-xl font-bold mb-4">User Information</h2>
      
      <div className="mb-2">
        <span className="font-semibold">Email:</span> {user.email}
      </div>
      
      <div className="mb-2">
        <span className="font-semibold">Supabase ID:</span>{' '}
        <span className="text-gray-400 text-sm">{user.id}</span>
      </div>
      
      <div className="mb-2">
        <span className="font-semibold">Backend User ID:</span>{' '}
        {loading ? (
          <span className="text-gray-400">Loading...</span>
        ) : error ? (
          <span className="text-red-400">Error: {error}</span>
        ) : backendUserId ? (
          <span className="text-green-400">{backendUserId}</span>
        ) : (
          <span className="text-yellow-400">Not assigned</span>
        )}
      </div>
    </div>
  );
};

export default UserInfo; 