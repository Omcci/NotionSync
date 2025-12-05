import { deleteSession } from './session'

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<Error | null> => {
  try {
    // Get session token from localStorage
    if (typeof window !== 'undefined') {
      const sessionToken = localStorage.getItem('session_token')
      if (sessionToken) {
        // Delete session from database
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: sessionToken }),
          })
        } catch (error) {
          console.error('Error deleting session:', error)
        }

        // Clear local storage
        localStorage.removeItem('session_token')
        localStorage.removeItem('onboarding_completed')
      }
    }

    return null
  } catch (error) {
    console.error('Error signing out:', error)
    return error instanceof Error ? error : new Error('Failed to sign out')
  }
}
