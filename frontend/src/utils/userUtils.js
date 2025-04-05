import supabase from '../supabaseClient';

/**
 * Gets the backend user ID for a Supabase user
 * First checks user metadata, then falls back to querying the mapping table
 * @param {Object} supabaseUser - The Supabase user object
 * @returns {Promise<string|null>} - The backend user ID or null if not found
 */
export const getBackendUserId = async (supabaseUser) => {
  if (!supabaseUser) return null;
  
  // First check if it's available in user metadata (faster)
  if (supabaseUser.user_metadata?.backend_user_id) {
    return supabaseUser.user_metadata.backend_user_id;
  }
  
  // Otherwise query the mapping table
  const { data, error } = await supabase
    .from('user_mapping')
    .select('backend_user_id')
    .eq('supabase_uid', supabaseUser.id)
    .single();
    
  if (error) {
    console.error("Error fetching backend user ID:", error);
    return null;
  }
  
  return data?.backend_user_id || null;
}; 