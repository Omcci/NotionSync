import { supabase } from './supabaseClient'

const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }
  return process.env.NEXT_PUBLIC_SITE_URL + '/auth/callback'
}

const signInWithGitHub = async (forceReauth = false) => {
  const options: any = {
    scopes: 'repo read:org read:user user:email',
    redirectTo: getRedirectUrl(),
    queryParams: {
      access_type: 'offline',
      prompt: forceReauth ? 'consent' : 'select_account'
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options,
  })

  if (error) {
    return { error }
  }

  return { data, error: null }
}

export const reauthorizeGitHub = async () => {
  await supabase.auth.signOut()
  await signInWithGitHub(true)
}

export default signInWithGitHub
