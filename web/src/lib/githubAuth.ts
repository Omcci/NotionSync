/**
 * GitHub OAuth helper functions
 * Handles direct GitHub OAuth flow without Supabase
 */

export interface GitHubOAuthConfig {
  clientId: string
  redirectUri: string
  scopes?: string
  state?: string
}

/**
 * Generate a random state string for OAuth security
 */
export const generateState = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Store state in sessionStorage for verification
 */
export const storeOAuthState = (state: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('github_oauth_state', state)
  }
}

/**
 * Verify and clear OAuth state
 */
export const verifyOAuthState = (state: string): boolean => {
  if (typeof window === 'undefined') return false
  const storedState = sessionStorage.getItem('github_oauth_state')
  if (storedState === state) {
    sessionStorage.removeItem('github_oauth_state')
    return true
  }
  return false
}

/**
 * Build GitHub OAuth URL
 */
export const buildGitHubOAuthUrl = (config: GitHubOAuthConfig): string => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes || 'repo read:user user:email',
    state: config.state || generateState(),
  })

  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

/**
 * Initiate GitHub OAuth flow
 */
export const initiateGitHubOAuth = (
  forceReauth: boolean = false
): { url: string; state: string } => {
  // Check for client ID
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID

  if (!clientId) {
    // In development, provide more helpful error
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        'NEXT_PUBLIC_GITHUB_CLIENT_ID is not configured. Please set this environment variable in your .env.local file or Docker build args.'
      )
    }
    throw new Error(
      'GitHub Client ID is not configured. Please contact support.'
    )
  }

  const redirectUri =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL ||
        'http://localhost:9001/auth/callback'

  const state = generateState()
  storeOAuthState(state)

  const url = buildGitHubOAuthUrl({
    clientId,
    redirectUri,
    scopes: 'repo read:user user:email',
    state,
  })

  // Add prompt parameter for forced reauth
  if (forceReauth) {
    const urlObj = new URL(url)
    urlObj.searchParams.set('prompt', 'consent')
    return { url: urlObj.toString(), state }
  }

  return { url, state }
}
