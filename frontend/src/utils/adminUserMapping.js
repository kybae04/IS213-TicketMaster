import supabase from '../supabaseClient';

/**
 * Creates a mapping between a Supabase user and a backend user ID
 * This can be used in an admin panel or directly from the console
 * 
 * @param {string} email - Email of the Supabase user to map
 * @param {string} backendUserId - Backend user ID to map to (format: user_XXX)
 * @returns {Promise<Object>} - Result of the mapping operation
 */
export const createUserMapping = async (email, backendUserId) => {
  try {
    // Validate backend user ID format
    if (!backendUserId.match(/^user_\d{3}$/)) {
      throw new Error('Backend user ID must be in the format user_XXX where XXX is a 3-digit number');
    }
    
    // Get the Supabase user ID from email
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError || !user) {
      console.error(`Error finding user with email ${email}:`, userError);
      return { success: false, error: `User with email ${email} not found` };
    }
    
    // Check if the user already has a mapping
    const { data: existingMapping, error: mappingError } = await supabase
      .from('user_mapping')
      .select('*')
      .eq('supabase_uid', user.id)
      .single();
    
    if (!mappingError && existingMapping) {
      return { 
        success: false, 
        error: `User already has mapping to ${existingMapping.backend_user_id}` 
      };
    }
    
    // Check if the backend user ID is already assigned
    const { data: existingBackendId, error: backendIdError } = await supabase
      .from('user_mapping')
      .select('*')
      .eq('backend_user_id', backendUserId)
      .single();
    
    if (!backendIdError && existingBackendId) {
      return { 
        success: false, 
        error: `Backend user ID ${backendUserId} is already assigned to another user` 
      };
    }
    
    // Create the mapping
    const { error: insertError } = await supabase
      .from('user_mapping')
      .insert([
        {
          supabase_uid: user.id,
          backend_user_id: backendUserId
        }
      ]);
    
    if (insertError) {
      console.error('Error creating mapping:', insertError);
      return { success: false, error: 'Failed to create mapping in database' };
    }
    
    // Update user metadata
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      user.id,
      { user_metadata: { backend_user_id: backendUserId } }
    );
    
    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // We succeeded in creating the mapping, so return success even if metadata update fails
    }
    
    return { 
      success: true, 
      message: `Successfully mapped user ${email} to backend ID ${backendUserId}` 
    };
    
  } catch (error) {
    console.error('Unexpected error in createUserMapping:', error);
    return { success: false, error: error.message };
  }
}; 