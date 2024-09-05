import { ReposResponse } from '@/pages/api/repos'
import { useQuery } from '@tanstack/react-query'
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react'

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
  setRepos: () => {},
  selectedRepo: null,
  setSelectedRepo: () => {},
  syncStatus: null,
  setSyncStatus: () => {},
}

const AppContext = createContext<AppContextType>(initialState)

interface AppProviderProps {
  children: ReactNode
}

const fetchRepos = async (): Promise<Repo[]> => {
  const username = process.env.NEXT_PUBLIC_USERNAME
  const response = await fetch(
    `/api/repos?username=${encodeURIComponent(username!)}`,
  )

  if (!response.ok) {
    throw new Error(`Error fetching repositories: ${response.status}`)
  }

  const data: ReposResponse = await response.json()
  if (data.repos) {
    return data.repos
  } else {
    throw new Error(data.error || 'Unknown error occurred')
  }
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [repos, setRepos] = useState<Repo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)

  const { data: fetchedRepos = [] } = useQuery<Repo[], Error>({
    queryKey: ['repos'],
    queryFn: fetchRepos,
  })

  useEffect(() => {
    if (fetchedRepos) {
      setRepos(fetchedRepos)
    }
  }, [fetchedRepos])

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
