import { supabase } from '../lib/supabase';

// Temporary utility function to update profile tags
// This can be called from the browser console for testing
export const updateProfileTags = async (profileId: string, tags: string[]) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ tags })
      .eq('id', profileId);
    
    if (error) {
      console.error('Error updating tags:', error);
      return { success: false, error };
    }
    
    console.log('Tags updated successfully for profile:', profileId);
    return { success: true, data };
  } catch (err) {
    console.error('Failed to update tags:', err);
    return { success: false, error: err };
  }
};

// Batch update tags based on roles
export const autoAssignTagsByRole = async () => {
  try {
    // Fetch all profiles
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('has_completed_profile', true);
    
    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      return;
    }
    
    console.log(`Found ${profiles?.length || 0} profiles to update`);
    
    // Update each profile based on role
    for (const profile of profiles || []) {
      let tags: string[] = [];
      const roleLower = profile.role.toLowerCase();
      
      if (roleLower.includes('founder') || roleLower.includes('co-founder')) {
        tags = ['Founder', 'Entrepreneur', 'Startup', 'Business'];
      } else if (roleLower.includes('developer')) {
        tags = ['Developer', 'Tech', 'Startup'];
      } else if (roleLower.includes('designer')) {
        tags = ['Designer', 'Creative'];
      } else if (roleLower.includes('cto')) {
        tags = ['Tech', 'Business', 'Startup'];
      } else if (roleLower.includes('marketing')) {
        tags = ['Marketing', 'Business'];
      } else if (roleLower.includes('sales')) {
        tags = ['Business', 'Marketing'];
      } else if (roleLower.includes('engineer')) {
        tags = ['Tech', 'Developer'];
      } else if (roleLower.includes('product')) {
        tags = ['Business', 'Tech', 'Startup'];
      }
      
      if (tags.length > 0) {
        console.log(`Updating ${profile.name} (${profile.role}) with tags:`, tags);
        await updateProfileTags(profile.id, tags);
      }
    }
    
    console.log('Batch tag update completed!');
  } catch (err) {
    console.error('Batch update failed:', err);
  }
};

// Make functions available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).updateProfileTags = updateProfileTags;
  (window as any).autoAssignTagsByRole = autoAssignTagsByRole;
}