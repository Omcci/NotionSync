import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SupabaseUser } from '../../types/user'
import { UserContextType } from '../../types/context'

// Define a simplified user type for our session-based auth
interface SessionUser {
  id: string
  email: string | null
  github_username: string | null
  full_name: string | null
  avatar_url: string | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [githubToken, setGithubToken] = useState<string | null>(null)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const queryClient = useQueryClient()

  // Track if we've checked for a token (to handle initial mount)
  const [hasCheckedToken, setHasCheckedToken] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  // Get session token from localStorage
  const getSessionToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('session_token')
  }

  // Check for token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getSessionToken()
      setSessionToken(token)
      setHasCheckedToken(true)
    }
  }, [])

  // Fetch session from API (only if we have a token)
  const { data: sessionData, isLoading: isSessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const token = getSessionToken()
      if (!token) {
        return null
      }

      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          // Session invalid, clear it
          if (typeof window !== 'undefined') {
            localStorage.removeItem('session_token')
            setSessionToken(null)
          }
          return null
        }

        const data = await response.json()
        return data
      } catch (error) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('session_token')
          setSessionToken(null)
        }
        return null
      }
    },
    enabled: hasCheckedToken && !!sessionToken, // Only run if we have a token
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })

  // isLoading is false if:
  // - We haven't checked for a token yet (initial mount)
  // - We've checked and there's no token (no need to load)
  // - We've checked, there's a token, and we're not loading anymore
  // isLoading is true only if we have a token and are actively loading
  const isLoading = hasCheckedToken && !!sessionToken && isSessionLoading

  // Fetch GitHub token when we have a valid session
  const { data: githubTokenData } = useQuery({
    queryKey: ['github-token', sessionData?.user?.id],
    queryFn: async () => {
      const token = getSessionToken()
      if (!token || !sessionData?.user) {
        return null
      }

      try {
        const response = await fetch('/api/auth/github-token', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          return null
        }

        const data = await response.json()
        return data.token
      } catch (error) {
        return null
      }
    },
    enabled: !!sessionData?.user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })

  const markOnboardingComplete = async () => {
    if (!user) return
    try {
      const token = getSessionToken()
      if (!token) return

      // Call API to mark onboarding complete
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: true }),
      })

      if (response.ok) {
        setHasCompletedOnboarding(true)
        if (supabaseUser) {
          setSupabaseUser({ ...supabaseUser, onboarding_completed: true })
        }
        localStorage.setItem('onboarding_completed', 'true')
      }
    } catch (error) {
      // Silently fail, onboarding status is not critical
    }
  }

  // Update state when session data changes
  useEffect(() => {
    if (sessionData?.user) {
      const userData = sessionData.user
      setUser({
        id: userData.id,
        email: userData.email,
        github_username: userData.github_username,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
      })

      // Set supabaseUser for compatibility
      setSupabaseUser({
        id: userData.id,
        email: userData.email,
        github_username: userData.github_username,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || new Date().toISOString(),
        isPremium: userData.isPremium || false,
        onboarding_completed: userData.onboarding_completed || false,
        github_token: null, // Don't expose in context
        github_refresh_token: null,
        github_token_updated_at: null,
      })

      setHasCompletedOnboarding(userData.onboarding_completed || false)
    } else {
      setUser(null)
      setSupabaseUser(null)
      setHasCompletedOnboarding(null)
    }
  }, [sessionData])

  // Update GitHub token when it changes
  useEffect(() => {
    setGithubToken(githubTokenData || null)
  }, [githubTokenData])

  const signOutUser = async () => {
    try {
      const token = getSessionToken()
      if (token) {
        // Call logout API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      // Continue with local logout even if API fails
    }

    // Clear local state
    localStorage.removeItem('session_token')
    localStorage.removeItem('onboarding_completed')
    setSessionToken(null)
    setUser(null)
    setGithubToken(null)
    setHasCompletedOnboarding(null)
    setSupabaseUser(null)

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['session'] })
    queryClient.invalidateQueries({ queryKey: ['github-token'] })

    // Redirect to home
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        githubToken,
        isLoading,
        signOutUser,
        setGithubToken,
        hasCompletedOnboarding,
        markOnboardingComplete,
        supabaseUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
