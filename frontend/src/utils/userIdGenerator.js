import supabase from '../supabaseClient';

/**
 * Generates a new backend user ID in the format user_XXX
 * This looks at existing IDs in the user_mapping table and
 * creates the next available ID
 */
export const generateBackendUserId = async () => {
  // Get the next available user_XXX ID
  const { data: existingIds, error } = await supabase
    .from('user_mapping')
    .select('backend_user_id')
    .order('backend_user_id', { ascending: false })
    .limit(1);
    
  if (error) throw error;
  
  let nextId = 1;
  if (existingIds && existingIds.length > 0) {
    // Extract the numeric part and increment
    const lastId = existingIds[0].backend_user_id;
    const numericPart = parseInt(lastId.split('_')[1], 10);
    nextId = numericPart + 1;
  }
  
  // Format with leading zeros to ensure 3 digits
  return `user_${String(nextId).padStart(3, '0')}`;
}; 