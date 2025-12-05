import { initiateGitHubOAuth } from './githubAuth'

/**
 * Sign in with GitHub OAuth
 */
const signInWithGitHub = async (forceReauth: boolean = false) => {
  try {
    const { url } = initiateGitHubOAuth(forceReauth)
    
    // Redirect to GitHub OAuth
    if (typeof window !== 'undefined') {
      window.location.href = url
    }
    
    return { data: { url }, error: null }
  } catch (error) {
    console.error('Error initiating GitHub OAuth:', error)
    return {
      error: error instanceof Error ? error : new Error('Failed to initiate GitHub OAuth'),
    }
  }
}

export const reauthorizeGitHub = async () => {
  return signInWithGitHub(true)
}

export default signInWithGitHub
