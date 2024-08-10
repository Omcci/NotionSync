import { supabase } from './supabaseClient'

const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
  })

  if (error) console.error('Error: ', error.message)
}

export default signInWithGitHub
