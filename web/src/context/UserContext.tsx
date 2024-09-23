import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { signOut } from '@/lib/logout'

interface UserContextType {
  user: User | null
  githubToken: string | null
  isLoading: boolean
  signOutUser: () => Promise<void>
  setGithubToken: (token: string | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [githubToken, setGithubToken] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession()
      return data?.session
    },
    staleTime: 1000 * 60 * 5,

  })

  useEffect(() => {
    if (data) {
      setUser(data.user)
      setGithubToken(data?.provider_token ?? null)
    }
  }, [data])

  const signOutUser = async () => {
    const error = await signOut()
    if (!error) {
      setUser(null)
      setGithubToken(null)
    }
  }

  // useEffect(() => {
  //   const checkAndRefreshSession = async () => {
  //     const { data, error } = await supabase.auth.getSession();
  //     if (data?.session) {
  //       const isTokenExpired = (data.session.expires_at ?? 0) < Math.floor(Date.now() / 1000) + 60;
  //       if (isTokenExpired) {
  //         const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
  //         if (refreshError || !refreshedData?.session?.provider_token) {
  //           console.log("Failed to refresh GitHub token, redirecting to login...");
  //           // Redirect to GitHub OAuth re-login
  //           await supabase.auth.signInWithOAuth({ provider: 'github' });
  //         } else {
  //           setGithubToken(refreshedData.session.provider_token);
  //         }
  //       }
  //     } else {
  //       await signOutUser();
  //     }
  //   };
  //   checkAndRefreshSession();
  // }, []);

  return (
    <UserContext.Provider value={{ user, githubToken, isLoading, signOutUser, setGithubToken }}>
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
