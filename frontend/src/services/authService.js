import supabase from '../supabaseClient';
import { generateBackendUserId } from '../utils/userIdGenerator';

/**
 * Register a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Supabase sign-up response
 */
export const signUp = async (email, password) => {
  // Register user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  
  // If registration is successful, create the mapping
  if (data.user) {
    try {
      // Generate a backend user ID
      const backendUserId = await generateBackendUserId();
      
      // Create the mapping in the user_mapping table
      const { error: mappingError } = await supabase
        .from('user_mapping')
        .insert([
          { 
            supabase_uid: data.user.id,
            backend_user_id: backendUserId
          }
        ]);
        
      if (mappingError) {
        console.error("Failed to create user ID mapping:", mappingError);
        // We'll still return the user even if mapping fails
      } else {
        console.log(`Successfully mapped user ${data.user.id} to backend ID ${backendUserId}`);
        
        // Store the backend_user_id in user metadata for easy access
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { backend_user_id: backendUserId }
        });
        
        if (metadataError) {
          console.error("Failed to update user metadata:", metadataError);
        }
      }
    } catch (mappingError) {
      console.error("Error in user ID mapping process:", mappingError);
    }
  }
  
  return data;
};

/**
 * Sign in a user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Supabase sign-in response
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // When user signs in, check if their backend_user_id in metadata is accurate
  // If not, update it from the mapping table
  if (data.user) {
    try {
      // Check if user has the correct backend_user_id in metadata
      const currentMetadataId = data.user.user_metadata?.backend_user_id;
      
      // Get the mapping from the database
      const { data: mappingData, error: mappingError } = await supabase
        .from('user_mapping')
        .select('backend_user_id')
        .eq('supabase_uid', data.user.id)
        .single();
      
      if (mappingError) {
        console.error("Error fetching user mapping:", mappingError);
      } else if (mappingData) {
        const correctBackendId = mappingData.backend_user_id;
        
        // If the ID in metadata doesn't match the one in the mapping table, update it
        if (currentMetadataId !== correctBackendId) {
          console.log(`Updating user metadata backend_user_id from ${currentMetadataId} to ${correctBackendId}`);
          
          // Update the user's metadata
          const { error: updateError } = await supabase.auth.updateUser({
            data: { backend_user_id: correctBackendId }
          });
          
          if (updateError) {
            console.error("Failed to update user metadata:", updateError);
          } else {
            console.log("Successfully updated user metadata with correct backend_user_id");
            
            // Update the user object in the returned data to include the correct ID
            data.user.user_metadata = {
              ...data.user.user_metadata,
              backend_user_id: correctBackendId
            };
          }
        }
      }
    } catch (err) {
      console.error("Error processing user mapping on sign in:", err);
    }
  }
  
  return data;
};

/**
 * Sign out the current user
 * @returns {Promise} - Supabase sign-out response
 */
export const signOut = async () => {
  try {
    console.log("Executing signOut in authService");
    
    // Force a complete signout with the scope: 'global' option
    // This ensures all devices and tabs are logged out
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      console.error("Supabase signOut error:", error);
      throw error;
    }
    
    // Clear any local storage items that might be related to authentication
    localStorage.removeItem('supabase.auth.token');
    
    // Clear session storage too
    sessionStorage.removeItem('supabase.auth.token');
    
    console.log("Supabase signOut successful");
    return true;
  } catch (err) {
    console.error("Exception in signOut:", err);
    throw err;
  }
};

/**
 * Get the current user session
 * @returns {Promise} - Supabase session data
 */
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data;
};

/**
 * Get the current user
 * @returns {Promise} - Supabase user data
 */
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  
  // If we have a user, ensure their backend_user_id metadata is up to date
  if (data.user) {
    try {
      const { data: mappingData, error: mappingError } = await supabase
        .from('user_mapping')
        .select('backend_user_id')
        .eq('supabase_uid', data.user.id)
        .single();
        
      if (mappingError) {
        console.error("Error fetching user mapping in getCurrentUser:", mappingError);
      } else if (mappingData && mappingData.backend_user_id) {
        const correctBackendId = mappingData.backend_user_id;
        const currentMetadataId = data.user.user_metadata?.backend_user_id;
        
        // If metadata doesn't match the database, update it
        if (currentMetadataId !== correctBackendId) {
          console.log(`Correcting user metadata backend_user_id from ${currentMetadataId} to ${correctBackendId}`);
          
          // Update the user's metadata
          await supabase.auth.updateUser({
            data: { backend_user_id: correctBackendId }
          });
          
          // Also update the user object we're about to return
          data.user.user_metadata = {
            ...data.user.user_metadata,
            backend_user_id: correctBackendId
          };
        }
      }
    } catch (err) {
      console.error("Error updating user metadata in getCurrentUser:", err);
    }
  }
  
  return data.user;
}; 