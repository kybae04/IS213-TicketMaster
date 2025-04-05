import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBackendUserId } from '../utils/userUtils';

/**
 * Custom hook that provides the backend user ID
 * @returns {Object} - Hook result with backendUserId and loading state
 */
export const useBackendUser = () => {
  const { user, isAuthenticated } = useAuth();
  const [backendUserId, setBackendUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBackendUserId = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!isAuthenticated || !user) {
          setBackendUserId(null);
          return;
        }
        
        const userId = await getBackendUserId(user);
        setBackendUserId(userId);
      } catch (err) {
        console.error('Error fetching backend user ID:', err);
        setError(err.message || 'Failed to fetch backend user ID');
      } finally {
        setLoading(false);
      }
    };

    fetchBackendUserId();
  }, [user, isAuthenticated]);

  return { backendUserId, loading, error };
};

export default useBackendUser; 