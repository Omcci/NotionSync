import { supabase } from './supabaseClient'

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error.message)
  }

  return error
}
