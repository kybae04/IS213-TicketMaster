import supabase from '../supabaseClient';

/**
 * Map of existing email addresses to backend user IDs
 * Replace these with actual mappings of existing accounts
 */
const existingUserMappings = [
  { email: "user1@example.com", backendUserId: "user_013" },
  { email: "user2@example.com", backendUserId: "user_035" },
  { email: "user3@example.com", backendUserId: "user_039" },
  // Add more mappings as needed
];

/**
 * Maps existing Supabase users to backend user IDs
 * Note: This requires admin access to Supabase
 */
const mapExistingUsers = async () => {
  console.log("Starting to map existing users...");
  
  for (const mapping of existingUserMappings) {
    try {
      console.log(`Processing mapping for email: ${mapping.email}`);
      
      // Find the Supabase user with this email
      const { data: userData, error: userError } = await supabase
        .from('auth.users') // This requires admin access
        .select('id')
        .eq('email', mapping.email)
        .single();
      
      if (userError) {
        console.error(`Error finding user ${mapping.email}:`, userError);
        continue;
      }
      
      if (!userData) {
        console.log(`User not found for email: ${mapping.email}`);
        continue;
      }
      
      const supabaseUid = userData.id;
      
      // Check if mapping already exists
      const { data: existingMapping, error: existingError } = await supabase
        .from('user_mapping')
        .select('*')
        .eq('supabase_uid', supabaseUid)
        .single();
      
      if (!existingError && existingMapping) {
        console.log(`Mapping already exists for ${mapping.email}. Skipping.`);
        continue;
      }
      
      // Create the mapping
      const { error: mappingError } = await supabase
        .from('user_mapping')
        .insert([
          { 
            supabase_uid: supabaseUid,
            backend_user_id: mapping.backendUserId
          }
        ]);
        
      if (mappingError) {
        console.error(`Error creating mapping for ${mapping.email}:`, mappingError);
        continue;
      }
      
      // Also update user metadata - requires admin functions
      // This part might need to be done through Supabase dashboard or admin API
      console.log(`Successfully mapped ${mapping.email} to ${mapping.backendUserId}`);
      
    } catch (error) {
      console.error(`Unexpected error processing ${mapping.email}:`, error);
    }
  }
  
  console.log("Finished mapping existing users.");
};

// Execute the function
mapExistingUsers()
  .then(() => console.log("Script completed"))
  .catch(err => console.error("Script failed:", err)); 