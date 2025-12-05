import { SessionUser, validateSession } from './session'

/**
 * Get the current session user
 */
export const getCurrentUser = async (): Promise<SessionUser | null> => {
  if (typeof window === 'undefined') {
    return null
  }

  const sessionToken = localStorage.getItem('session_token')
  if (!sessionToken) {
    return null
  }

  try {
    // Validate session via API
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
    })

    if (!response.ok) {
      // Session invalid, clear it
      localStorage.removeItem('session_token')
      return null
    }

    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get GitHub token for the current user
 */
export const getGitHubToken = async (): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error('Cannot get GitHub token on server side')
  }

  const sessionToken = localStorage.getItem('session_token')
  if (!sessionToken) {
    throw new Error('Unauthorized: No session found. Please log in.')
  }

  try {
    const response = await fetch('/api/auth/github-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        error.message ||
          'Unauthorized: No valid GitHub token available. Please re-authenticate with GitHub.'
      )
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(
          'Unauthorized: No valid GitHub token available. Please re-authenticate with GitHub.'
        )
  }
}
