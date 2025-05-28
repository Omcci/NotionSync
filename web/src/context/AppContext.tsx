import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SyncRepo } from '../../types/repository'
import { SyncStatus } from '../../types/sync'
import { AppContextType, AppProviderProps } from '../../types/context'
import { GitHubService } from '@/services/githubService'

const AppContext = createContext<AppContextType | undefined>(undefined)

const fetchRepos = async (githubToken: string): Promise<SyncRepo[]> => {
  const repos = await GitHubService.getUserRepos(githubToken)
  const transformedRepos = repos.map((repo) => ({
    id: repo.id.toString(),
    name: repo.name,
    owner: repo.full_name.split('/')[0],
    description: repo.description || undefined,
    private: repo.private,
    language: repo.language || undefined,
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    updated_at: repo.updated_at,
    html_url: repo.html_url,
    clone_url: repo.clone_url,
    ssh_url: repo.ssh_url,
    default_branch: repo.default_branch || 'main',
  }))
  return transformedRepos
}

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  githubToken,
}) => {
  const [repos, setRepos] = useState<SyncRepo[]>([])
  const [selectedRepo, setSelectedRepo] = useState<SyncRepo | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [tokenValidationError, setTokenValidationError] = useState<
    string | null
  >(null)

  const {
    data: fetchedRepos,
    isLoading: isLoadingRepos,
    refetch: refetchRepos,
    error,
  } = useQuery({
    queryKey: ['repos', githubToken],
    queryFn: () => fetchRepos(githubToken!),
    enabled: !!githubToken,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      if (
        error?.message?.includes('401') ||
        error?.message?.includes('Bad credentials')
      ) {
        setTokenValidationError('GitHub token is invalid or expired')
        return false
      }
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  // Update local state when query data changes
  React.useEffect(() => {
    if (fetchedRepos) {
      setRepos(fetchedRepos)
      setTokenValidationError(null)
    }
  }, [fetchedRepos, isLoadingRepos, error])

  // Handle visibility change to force refetch after long absence
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && githubToken) {
        const lastFetch = localStorage.getItem('lastReposFetch')
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        if (!lastFetch || now - parseInt(lastFetch) > fiveMinutes) {
          refetchRepos()
          localStorage.setItem('lastReposFetch', now.toString())
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [githubToken, refetchRepos])

  // Always provide the context, let individual components handle authentication requirements
  return (
    <AppContext.Provider
      value={{
        repos,
        setRepos,
        selectedRepo,
        setSelectedRepo,
        isLoadingRepos,
        refetchRepos,
        syncStatus,
        setSyncStatus,
        tokenValidationError,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
