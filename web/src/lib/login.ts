import { supabase } from './supabaseClient'
import { getAuthCallbackUrl, getAppCallbackUrl } from './config'
import type { AuthError, AuthResponse, Session, User } from '@supabase/supabase-js'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const signInWithGitHub = async (forceReauth = false) => {
  const maxRetries = 3
  let retryCount = 0

  const options = {
    scopes: 'repo read:user user:email',
    redirectTo: getAppCallbackUrl(),
    queryParams: {
      access_type: 'offline',
      prompt: forceReauth ? 'consent' : 'select_account',
    },
    flowType: 'pkce' as const,
    skipBrowserRedirect: false,
  }

  while (retryCount < maxRetries) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options,
      })

      if (error) {
        if (error.message?.includes('rate limit') || error.message?.includes('temporarily unavailable')) {
          await delay(Math.pow(2, retryCount) * 1000)
          retryCount++
          continue
        }
        return { error }
      }

      return { data, error: null }
    } catch (error) {
      // If it's a network error or temporary failure, retry
      if (error instanceof Error &&
        (error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('temporarily unavailable'))) {
        await delay(Math.pow(2, retryCount) * 1000)
        retryCount++
        continue
      }
      return { error }
    }
  }

  // If we've exhausted retries, return the last error
  return {
    error: new Error('Failed to authenticate with GitHub after multiple attempts. Please try again later.')
  }
}

export const reauthorizeGitHub = async () => {
  await supabase.auth.signOut()
  await signInWithGitHub(true)
}

export default signInWithGitHub
