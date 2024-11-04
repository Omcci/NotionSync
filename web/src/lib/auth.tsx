import { supabase } from './supabaseClient'

export const getGitHubToken = async (): Promise<string> => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const githubToken = session?.provider_token
  if (!githubToken) {
    throw new Error('Unauthorized: No GitHub token available')
  }

  return githubToken
}
