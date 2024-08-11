import { supabase } from './supabaseClient'

const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
  })

  if (error) {
    console.error('Error: ', error.message)
    alert('Failed to sign in: ' + error.message)
  } else {
    alert('Successfully signed in with GitHub!')
  }
}

export default signInWithGitHub
