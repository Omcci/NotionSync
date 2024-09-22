import { supabase } from '@/lib/supabaseClient'
import { ReposResponse } from '@/pages/api/repos'
import { useQuery } from '@tanstack/react-query'
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react'
import { useUser } from './UserContext'

interface Repo {
  id: string
  name: string
  org: string
}

interface SyncStatus {
  lastSyncDate: string | null
  errorBranch: string | null
  statusMessage: string | null
}

interface AppContextType {
  repos: Repo[]
  setRepos: (repos: Repo[]) => void
  selectedRepo: Repo | null
  setSelectedRepo: (repo: Repo | null) => void
  syncStatus: SyncStatus | null
  setSyncStatus: (status: SyncStatus | null) => void
}

const initialState: AppContextType = {
  repos: [],
  setRepos: () => { },
  selectedRepo: null,
  setSelectedRepo: () => { },
  syncStatus: null,
  setSyncStatus: () => { },
}

const AppContext = createContext<AppContextType>(initialState)

interface AppProviderProps {
  children: ReactNode
}

const fetchRepos = async (githubToken: string): Promise<Repo[]> => {
  const response = await fetch(`/api/repos?githubToken=${githubToken}`)
  if (!response.ok) {
    throw new Error(`Error fetching repositories: ${response.status}`)
  }
  const data: ReposResponse = await response.json()
  return data.repos || []
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)

  const { githubToken, refreshSession } = useUser()


  const { data: fetchedRepos = [], refetch } = useQuery<Repo[], Error>({
    queryKey: ['repos', githubToken],
    queryFn: () => fetchRepos(githubToken!),
    enabled: !!githubToken,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (
      fetchedRepos.length &&
      JSON.stringify(fetchedRepos) !== JSON.stringify(repos)
    ) {
      setRepos(fetchedRepos)
    }
  }, [fetchedRepos, repos])

  const refreshAndFetchRepos = async () => {
    if (!githubToken) {
      await refreshSession()
    } else {
      refetch()
    }
  }

  useEffect(() => {
    if (githubToken) {
      refetch()
    } else {
      refreshAndFetchRepos()
    }
  }, [githubToken, refetch])

  const value = {
    repos,
    setRepos,
    selectedRepo,
    setSelectedRepo,
    syncStatus,
    setSyncStatus,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppContext = () => useContext(AppContext)
