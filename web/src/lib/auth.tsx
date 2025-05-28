import { supabase } from './supabaseClient'
import { TokenValidationService } from '@/services/tokenValidationService'

export const getGitHubToken = async (): Promise<string> => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check for fresh provider token in session (highest priority)
  if (session?.provider_token) {
    return session.provider_token
  }

  // Fallback: get validated token from database
  if (session?.user?.id) {
    try {
      const validToken = await TokenValidationService.getValidGitHubToken(session.user.id)
      if (validToken) {
        return validToken
      }
    } catch (error) {
      console.error('Error getting valid GitHub token:', error)
    }
  }
  throw new Error('Unauthorized: No valid GitHub token available. Please re-authenticate with GitHub.')
}
