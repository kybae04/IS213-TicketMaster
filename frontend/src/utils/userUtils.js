import supabase from '../supabaseClient';

/**
 * Gets the backend user ID for a Supabase user
 * First checks the mapping table, then falls back to metadata if necessary
 * This is reversed from the original because the database is the source of truth
 * @param {Object} supabaseUser - The Supabase user object
 * @returns {Promise<string|null>} - The backend user ID or null if not found
 */
export const getBackendUserId = async (supabaseUser) => {
  if (!supabaseUser) {
    console.warn('No Supabase user provided to getBackendUserId');
    return null;
  }
  
  console.log('Getting backend user ID for Supabase user:', {
    id: supabaseUser.id,
    email: supabaseUser.email
  });
  
  // First check the mapping table (source of truth)
  try {
    console.log(`Querying user_mapping table for supabase_uid: ${supabaseUser.id}`);
    const { data, error } = await supabase
      .from('user_mapping')
      .select('backend_user_id')
      .eq('supabase_uid', supabaseUser.id)
      .single();
      
    if (error) {
      console.error("Error fetching backend user ID from database:", error);
    } else if (data && data.backend_user_id) {
      console.log('Found backend user ID in database:', data.backend_user_id);
      
      // If the metadata doesn't match the database, update it
      if (supabaseUser.user_metadata?.backend_user_id !== data.backend_user_id) {
        console.log(`Metadata backend_user_id (${supabaseUser.user_metadata?.backend_user_id}) doesn't match database (${data.backend_user_id}). Will update metadata.`);
        
        // Update the user's metadata (we don't wait for this to complete)
        supabase.auth.updateUser({
          data: { backend_user_id: data.backend_user_id }
        }).then(result => {
          if (result.error) {
            console.error("Failed to update user metadata:", result.error);
          } else {
            console.log("Successfully updated user metadata with correct backend_user_id");
          }
        });
      }
      
      return data.backend_user_id;
    }
  } catch (dbError) {
    console.error("Exception querying user_mapping table:", dbError);
  }
  
  // If database lookup failed, check metadata as fallback
  if (supabaseUser.user_metadata?.backend_user_id) {
    console.log('Falling back to backend user ID from metadata:', supabaseUser.user_metadata.backend_user_id);
    console.warn('Warning: Using metadata as fallback, but this might be incorrect if the database has been updated');
    return supabaseUser.user_metadata.backend_user_id;
  }
  
  console.error('Could not find backend user ID for this user in database or metadata');
  return null;
}; 