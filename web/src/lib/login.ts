import { supabase } from './supabaseClient'

const getRedirectUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  return 'https://notionsync.fr'
}

const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: getRedirectUrl(),
    },
  })

  if (error) {
    console.error('Error: ', error.message)
    alert('Failed to sign in: ' + error.message)
  } else {
    alert('Successfully signed in with GitHub!')
  }
}

export default signInWithGitHub
