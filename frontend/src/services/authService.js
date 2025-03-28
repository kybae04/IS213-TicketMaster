import supabase from '../supabaseClient';

/**
 * Register a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Supabase sign-up response
 */
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
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