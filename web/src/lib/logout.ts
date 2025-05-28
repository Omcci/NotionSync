import { supabase } from './supabaseClient'

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return error
}
