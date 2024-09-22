import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'

interface UserContextType {
  user: User | null
  githubToken: string | null
  refreshSession: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [githubToken, setGithubToken] = useState<string | null>(null)

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Error refreshing session:', error.message)
      await supabase.auth.signOut()
      setUser(null)
      setGithubToken(null)
      localStorage.clear()
      sessionStorage.clear()
    } else if (data.session) {
      setUser(data.session.user)
      const savedToken = sessionStorage.getItem('github_token')
      if (!savedToken) {
        sessionStorage.setItem(
          'github_token',
          data.session.provider_token ?? '',
        )
        setGithubToken(data.session.provider_token ?? null)
      } else {
        setGithubToken(savedToken)
      }
    }
  }

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      const savedToken = sessionStorage.getItem('github_token')
      if (savedToken) {
        setGithubToken(savedToken)
      } else {
        setUser(data?.session?.user ?? null)
        setGithubToken(data?.session?.provider_token ?? null)
      }
    }

    getSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          sessionStorage.setItem('github_token', session.provider_token ?? '')
          setGithubToken(session.provider_token ?? null)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setGithubToken(null)
          sessionStorage.clear()
        }
      },
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, githubToken, refreshSession }}>
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
