import { supabase } from './supabaseClient';

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error signing out:', error.message);
};

export default signOut;