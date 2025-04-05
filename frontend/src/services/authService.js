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
  return data;
};

/**
 * Sign out the current user
 * @returns {Promise} - Supabase sign-out response
 */
export const signOut = async () => {
  try {
    console.log("Executing signOut in authService");
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Supabase signOut error:", error);
      throw error;
    }
    
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
  return data.user;
}; 