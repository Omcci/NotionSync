import { supabase } from './supabaseClient'

const getRedirectUrl = () => {
  const currentUrl = window.location.href
  return currentUrl
}

const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      scopes: 'repo read:org',
      redirectTo: getRedirectUrl(),
    },
  })

  if (error) {
    console.error('Error during sign-in:', error.message)
    return
  }
}

export default signInWithGitHub
