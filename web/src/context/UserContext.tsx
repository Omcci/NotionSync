import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { signOut } from '@/lib/logout'
import { UserService } from '@/services/userService'
import { SupabaseUser } from '../../types/user'
import { UserContextType } from '../../types/context'
import { SessionUser } from '@/lib/session'

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

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      if (typeof window === 'undefined') {
        return null
      }

      const sessionToken = localStorage.getItem('session_token')
      if (!sessionToken) {
        return null
      }

      try {
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
        console.error('Error fetching session:', error)
        return null
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const markOnboardingComplete = async () => {
    if (!user) return
    try {
      await UserService.markOnboardingComplete(user.id)
      setHasCompletedOnboarding(true)
      if (supabaseUser) {
        setSupabaseUser({ ...supabaseUser, onboarding_completed: true })
      }
      localStorage.setItem('onboarding_completed', 'true')
    } catch (error) {
      console.error('Error marking onboarding complete:', error)
    }
  }

  useEffect(() => {
    const handleUserSession = async () => {
      if (sessionData) {
        setUser(sessionData)

        // Get GitHub token from database
        try {
          const storedToken = await UserService.getGitHubToken(sessionData.id)
          setGithubToken(storedToken)
        } catch (error) {
          console.error('Error getting GitHub token:', error)
          setGithubToken(null)
        }

        // Get full user data from database
        try {
          const dbUser = await UserService.getUserById(sessionData.id)
          if (dbUser) {
            setSupabaseUser(dbUser)
            setHasCompletedOnboarding(dbUser.onboarding_completed)
          } else {
            setHasCompletedOnboarding(sessionData.onboarding_completed)
          }
        } catch (error) {
          console.error('Error getting user data:', error)
          setHasCompletedOnboarding(sessionData.onboarding_completed)
        }
      } else {
        setUser(null)
        setGithubToken(null)
        setHasCompletedOnboarding(null)
        setSupabaseUser(null)
      }
    }
    handleUserSession()
  }, [sessionData])

  const signOutUser = async () => {
    // Clear stored GitHub token on logout
    if (user) {
      try {
        await UserService.clearGitHubToken(user.id)
      } catch (error) {
        console.error('Error clearing GitHub token:', error)
      }
    }

    const error = await signOut()
    if (!error) {
      setUser(null)
      setGithubToken(null)
      setHasCompletedOnboarding(null)
      setSupabaseUser(null)
    }
  }

  return (
    <UserContext.Provider
      value={{
        user: user as any, // Type compatibility with existing code
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
