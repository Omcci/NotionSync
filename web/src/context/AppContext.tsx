import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SyncRepo } from '../../types/repository'
import { SyncStatus } from '../../types/sync'
import { AppContextType, AppProviderProps } from '../../types/context'
import { CacheService } from '@/services/cacheService'
import { RepositoryService } from '@/services/repositoryService'

const AppContext = createContext<AppContextType | undefined>(undefined)

const fetchReposWithCache = async (userId: string, githubToken: string): Promise<SyncRepo[]> => {
  try {
    // Use CacheService to get repositories with proper caching strategy
    const cacheResult = await CacheService.getRepositories(userId, githubToken, {
      repositoryCacheTime: 60, // 1 hour cache
      forceRefresh: false
    })

    // If no repositories found and cache is not fresh, this might be a first-time user
    if (cacheResult.data.length === 0 && !cacheResult.isFresh) {
      console.log('📭 No repositories found in cache. User may need to sync repositories first.')
      return []
    }

    // Transform DatabaseRepository to SyncRepo format
    const transformedRepos: SyncRepo[] = cacheResult.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      owner: repo.owner,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      stars: repo.stars || 0,
      forks: repo.forks || 0,
      updated_at: repo.lastUpdated,
      html_url: repo.url,
      clone_url: repo.url + '.git',
      ssh_url: `git@github.com:${repo.owner}/${repo.name}.git`,
      default_branch: 'main',
    }))

    return transformedRepos
  } catch (error) {
    console.error('Error fetching repositories with cache:', error)

    // Fallback to database only if cache fails
    try {
      const { repositories: dbRepos } = await RepositoryService.getUserRepositories(userId)
      return dbRepos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        owner: repo.owner,
        description: repo.description,
        private: repo.private,
        language: repo.language,
        stars: repo.stars || 0,
        forks: repo.forks || 0,
        updated_at: repo.lastUpdated,
        html_url: repo.url,
        clone_url: repo.url + '.git',
        ssh_url: `git@github.com:${repo.owner}/${repo.name}.git`,
        default_branch: 'main',
      }))
    } catch (dbError) {
      console.error('Database fallback also failed:', dbError)
      return []
    }
  }
}

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  githubToken,
  userId,
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
    queryKey: ['repos', userId, githubToken],
    queryFn: () => fetchReposWithCache(userId!, githubToken!),
    enabled: !!userId && !!githubToken, // Enable when we have both userId and token
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true, // Enable mount refetch since we now have proper caching
    retry: (failureCount, error) => {
      if (
        error?.message?.includes('401') ||
        error?.message?.includes('Bad credentials')
      ) {
        setTokenValidationError('GitHub token is invalid or expired')
        return false
      }

      // Don't retry rate limit errors
      if (error?.message?.includes('rate limit')) {
        setTokenValidationError('GitHub API rate limit exceeded. Please try again later.')
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
