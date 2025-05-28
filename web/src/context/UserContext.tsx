import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { signOut } from '@/lib/logout'
import { UserService } from '@/services/userService'
import { SupabaseUser } from '../../types/user'
import { UserContextType } from '../../types/context'

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [githubToken, setGithubToken] = useState<string | null>(null)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession()
      return data?.session
    },
    staleTime: 1000 * 60 * 5,
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
      if (data) {
        setUser(data.user)
        // Get GitHub token with priority: session > database
        let githubToken = null
        let shouldStoreToken = false
        // Check for fresh token from OAuth session
        if (data.provider_token) {
          githubToken = data.provider_token
          shouldStoreToken = true
        } else if (data.user?.user_metadata?.provider_token) {
          githubToken = data.user.user_metadata.provider_token
          shouldStoreToken = true
        } else if (data.user?.app_metadata?.provider_token) {
          githubToken = data.user.app_metadata.provider_token
          shouldStoreToken = true
        }
        // Fallback to database token if no session token
        if (!githubToken && data.user) {
          try {
            const storedToken = await UserService.getGitHubToken(data.user.id)
            if (storedToken) {
              githubToken = storedToken
            }
          } catch (error) {
            console.error('Error getting GitHub token:', error)
          }
        }
        // Store fresh token in database
        if (githubToken && shouldStoreToken && data.user) {
          try {
            await UserService.storeGitHubToken(
              data.user.id,
              githubToken,
              data.provider_refresh_token || undefined
            )
          } catch (error) {
            console.error('Error storing GitHub token:', error)
          }
        }
        setGithubToken(githubToken)
        // Sync user with database
        if (data.user) {
          try {
            const syncedUser = await UserService.syncUserWithDatabase(data.user)
            setSupabaseUser(syncedUser)
            setHasCompletedOnboarding(syncedUser.onboarding_completed)
          } catch (error) {
            // Fallback: check onboarding status directly
            try {
              const onboardingStatus = await UserService.getOnboardingStatus(data.user.id)
              setHasCompletedOnboarding(onboardingStatus)
            } catch (fallbackError) {
              setHasCompletedOnboarding(false)
            }
          }
        }
      } else {
        setUser(null)
        setGithubToken(null)
        setHasCompletedOnboarding(null)
        setSupabaseUser(null)
      }
    }
    handleUserSession()
  }, [data])

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
        user,
        githubToken,
        isLoading,
        signOutUser,
        setGithubToken,
        hasCompletedOnboarding,
        markOnboardingComplete,
        supabaseUser
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
