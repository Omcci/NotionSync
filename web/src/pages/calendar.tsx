import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Commit } from '../../types/types'
import { useAppContext } from '@/context/AppContext'
import SelectComponent from '@/components/SelectComponent'
import ModalCommits from '@/components/ModalCommits'
import { useUser } from '@/context/UserContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import LoadingScreen from '@/components/LoadingScreen'
import { getGitHubToken } from '@/lib/auth'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarDaysIcon } from '../../public/icon/CalendarDaysIcon'
import { format } from 'date-fns'
import { RefreshCw, Github, AlertCircle, ChevronDown, ExternalLink } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { CommitCalendar } from '@/components/calendar/CommitCalendar'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Fetch ALL commits for the user (extensive range with pagination)
const fetchAllCommits = async (userId: string, maxCommitsPerRepo: number = 1000, forceRefresh: boolean = false) => {
  const githubToken = await getGitHubToken()

  // Get extensive data range (5 years)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(endDate.getFullYear() - 5)

  const params = new URLSearchParams({
    userId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    forceRefresh: forceRefresh.toString(),
    maxCommitsPerRepo: maxCommitsPerRepo.toString(),
    // Use smart caching
    repositoryCacheTime: '60', // 1 hour
    commitCacheTime: '30', // 30 minutes
  })

  console.log(`🗓️ Fetching commits from ${startDate.toISOString()} to ${endDate.toISOString()}`)
  console.log(`🎯 Max commits per repo: ${maxCommitsPerRepo}`)

  const response = await fetch(`/api/smart-cache/commits?${params}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)

    // Handle authentication errors specifically
    if (response.status === 401 && errorData?.authRequired) {
      const error = new Error(errorData.message || 'Authentication required')
      error.message = errorData.error || error.message
      // Add a flag to indicate this is an auth error
      Object.assign(error, { authRequired: true, redirectTo: errorData.redirectTo })
      throw error
    }

    // Handle rate limit errors
    if (response.status === 429) {
      const error = new Error(errorData?.message || 'GitHub API rate limit exceeded')
      Object.assign(error, { rateLimited: true, retryAfter: errorData?.retryAfter })
      throw error
    }

    // Generic error fallback
    const errorText = errorData?.error || await response.text() || `HTTP ${response.status}`
    throw new Error(`Error fetching commits: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  // Log successful response for debugging
  console.log(`✅ Successfully fetched commits:`, {
    totalCommits: result.metadata?.commits?.count || 0,
    source: result.metadata?.commits?.source || 'unknown',
    repositories: result.metadata?.pagination?.totalRepositories || 0,
    limitedRepositories: result.metadata?.pagination?.limitedRepositories || 0
  })

  return result
}

// Fetch next batch of commits going backward from a specific date
const fetchNextCommitBatch = async (
  userId: string,
  fromDate: Date,
  maxCommitsPerRepo: number = 1000,
  forceRefresh: boolean = false
) => {
  const githubToken = await getGitHubToken()

  // End date: the date we're fetching from (exclusive)
  const endDate = new Date(fromDate)
  endDate.setHours(23, 59, 59, 999)

  // Start date: go back far enough to get a good batch
  // Start with 1 year before to ensure we get 1000 commits
  const startDate = new Date(fromDate)
  startDate.setFullYear(startDate.getFullYear() - 1)
  startDate.setHours(0, 0, 0, 0)

  const params = new URLSearchParams({
    userId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    forceRefresh: forceRefresh.toString(),
    maxCommitsPerRepo: maxCommitsPerRepo.toString(),
    // Use smart caching
    repositoryCacheTime: '30', // 30 minutes
    commitCacheTime: '15', // 15 minutes
  })

  console.log(`🔄 Fetching next batch from ${format(fromDate, 'MMM yyyy')}`)
  console.log(`📅 Date range: ${format(startDate, 'MMM yyyy')} ← ${format(endDate, 'MMM yyyy')}`)

  const response = await fetch(`/api/smart-cache/commits?${params}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)

    // Handle authentication errors specifically
    if (response.status === 401 && errorData?.authRequired) {
      const error = new Error(errorData.message || 'Authentication required')
      error.message = errorData.error || error.message
      Object.assign(error, { authRequired: true, redirectTo: errorData.redirectTo })
      throw error
    }

    // Handle rate limit errors
    if (response.status === 429) {
      const error = new Error(errorData?.message || 'GitHub API rate limit exceeded')
      Object.assign(error, { rateLimited: true, retryAfter: errorData?.retryAfter })
      throw error
    }

    const errorText = errorData?.error || await response.text() || `HTTP ${response.status}`
    throw new Error(`Error fetching next commit batch: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  console.log(`✅ Next batch fetched:`, {
    totalCommits: result.metadata?.commits?.count || 0,
    source: result.metadata?.commits?.source || 'unknown',
    fromDate: format(fromDate, 'MMM yyyy')
  })

  return {
    ...result,
    batchInfo: { startDate, endDate, fromDate }
  }
}

const CalendarPage = () => {
  const [filteredCommits, setFilteredCommits] = useState<Commit[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [commitDetails, setCommitDetails] = useState<Commit[]>([])
  const [open, setOpen] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<string>('dayGridMonth')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [maxCommitsPerRepo, setMaxCommitsPerRepo] = useState(1000)
  const [paginationInfo, setPaginationInfo] = useState<any>(null)

  // New state for sequential batching
  const [loadedBatches, setLoadedBatches] = useState<Array<{
    startDate: Date
    endDate: Date
    fromDate: Date
    commitCount: number
  }>>([])
  const [isBatchFetching, setIsBatchFetching] = useState(false)
  const [oldestCommitDate, setOldestCommitDate] = useState<Date | null>(null)
  const [thousandthCommitDate, setThousandthCommitDate] = useState<Date | null>(null) // Track the 1000th commit specifically
  const [fetchedDateRanges, setFetchedDateRanges] = useState<Array<{
    startDate: Date
    endDate: Date
  }>>([]) // Track all fetched date ranges to prevent duplicates

  const { user, githubToken } = useUser()
  const { repos, selectedRepo, setSelectedRepo } = useAppContext()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()

  // Query for fetching ALL commits with pagination
  const {
    data: commitResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['all-commits-paginated', user?.id, maxCommitsPerRepo],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated')
      return fetchAllCommits(user.id, maxCommitsPerRepo, false)
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // Consider data stale after 10 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      // Don't retry authentication errors
      if (error?.message?.includes('authRequired') ||
        error?.message?.includes('Unauthorized') ||
        error?.message?.includes('GitHub token')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: 2000,
  })

  // Extract commits and metadata from response
  const commitData = useMemo(() => commitResponse?.commits || [], [commitResponse?.commits])
  const metadata = commitResponse?.metadata

  // Update pagination info and last sync time
  useEffect(() => {
    if (metadata) {
      setPaginationInfo(metadata.pagination)
      if (metadata.commits?.lastUpdated) {
        setLastSyncTime(metadata.commits.lastUpdated)
      }
    }
  }, [metadata])

  // Initialize loaded batches when initial commits are loaded
  useEffect(() => {
    if (commitData && commitData.length > 0 && loadedBatches.length === 0) {
      // Find the date range of the initially loaded commits
      const dates = commitData.map((commit: Commit) =>
        new Date(commit.date || commit.commit.author.date)
      ).sort((a: Date, b: Date) => a.getTime() - b.getTime())

      if (dates.length > 0) {
        const startDate = dates[0] // Oldest commit date
        const endDate = dates[dates.length - 1] // Newest commit date

        console.log(`📊 Initial commit range: ${format(startDate, 'MMM yyyy')} → ${format(endDate, 'MMM yyyy')}`)
        console.log(`📊 Total initial commits: ${commitData.length}`)

        // Set the oldest commit date for general reference
        setOldestCommitDate(startDate)

        setLoadedBatches([{
          startDate,
          endDate,
          fromDate: startDate,
          commitCount: commitData.length
        }])
      }
    }
  }, [commitData, loadedBatches.length])

  // Separate effect to track 1000th commit (works for both fresh and cached data)
  useEffect(() => {
    if (commitData && commitData.length >= 1000) {
      // Sort commits by date (newest first) to find the 1000th commit
      const sortedCommits = [...commitData].sort((a: Commit, b: Commit) => {
        const dateA = new Date(a.date || a.commit.author.date)
        const dateB = new Date(b.date || b.commit.author.date)
        return dateB.getTime() - dateA.getTime()
      })

      // The 1000th commit is at index 999 (0-based)
      const thousandthCommit = sortedCommits[999]
      const thousandthDate = new Date(thousandthCommit.date || thousandthCommit.commit.author.date)

      setThousandthCommitDate(thousandthDate)
      console.log(`🎯 1000th commit date set to: ${format(thousandthDate, 'MMM yyyy')} (from ${commitData.length} total commits)`)
    } else if (commitData && commitData.length < 1000) {
      // Clear 1000th commit date if we don't have enough commits
      setThousandthCommitDate(null)
      console.log(`📊 Less than 1000 commits (${commitData.length}), clearing 1000th commit tracking`)
    }
  }, [commitData])

  // Helper function to check if a date is already covered by fetched ranges
  const isDateCovered = useCallback((targetDate: Date) => {
    return fetchedDateRanges.some(range =>
      targetDate >= range.startDate && targetDate <= range.endDate
    )
  }, [fetchedDateRanges])

  // Helper function to check if we're navigating past the 1000th commit boundary
  const isNavigatingPastBoundary = useCallback((targetDate: Date) => {
    if (!thousandthCommitDate) return false

    // We're past the boundary if the target date is OLDER than the 1000th commit
    return targetDate < thousandthCommitDate
  }, [thousandthCommitDate])

  // Update filtered commits when data or selected repo changes
  useEffect(() => {
    if (commitData) {
      let commitsToUse = commitData

      // Filter by selected repo
      if (selectedRepo) {
        commitsToUse = commitData.filter(
          (commit: Commit) => commit.repoName === selectedRepo.name,
        )
      }

      setFilteredCommits(commitsToUse)

      // Log commit stats for debugging
      console.log(`📊 Commit Statistics:`)
      console.log(`  - Total commits: ${commitData.length}`)
      console.log(`  - Filtered commits: ${commitsToUse.length}`)
      console.log(`  - Selected repo: ${selectedRepo?.name || 'All'}`)

      // Show breakdown by repository
      const repoBreakdown = commitData.reduce((acc: Record<string, number>, commit: Commit) => {
        const repoName = commit.repoName || 'Unknown'
        acc[repoName] = (acc[repoName] || 0) + 1
        return acc
      }, {})
      console.log(`  - Repository breakdown:`, repoBreakdown)
    }
  }, [commitData, selectedRepo])

  // Mutation for force refresh
  const forceRefreshMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return await fetchAllCommits(user.id, maxCommitsPerRepo, true)
    },
    onSuccess: (result) => {
      setLastSyncTime(new Date().toISOString())

      const source = result.metadata?.commits?.source || 'unknown'
      const count = result.metadata?.commits?.count || 0

      toast({
        title: 'Calendar refreshed',
        description: `Loaded ${count} commits from ${source === 'github' ? 'GitHub API' : 'cache'}`,
      })

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['all-commits-paginated'] })
    },
    onError: (error) => {
      toast({
        title: 'Refresh failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    },
  })

  // Mutation for loading more commits
  const loadMoreMutation = useMutation({
    mutationFn: async (newMaxCommits: number) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return await fetchAllCommits(user.id, newMaxCommits, true)
    },
    onSuccess: (result) => {
      const count = result.metadata?.commits?.count || 0
      toast({
        title: 'More commits loaded',
        description: `Now showing ${count} total commits`,
      })

      queryClient.invalidateQueries({ queryKey: ['all-commits-paginated'] })
    },
    onError: (error) => {
      toast({
        title: 'Failed to load more commits',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    },
  })

  // Next batch fetch mutation
  const nextBatchMutation = useMutation({
    mutationFn: async (fromDate: Date) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      // Don't set isBatchFetching here - do it in onMutate
      return await fetchNextCommitBatch(user.id, fromDate, maxCommitsPerRepo, false)
    },
    onMutate: async (fromDate: Date) => {
      // Set fetching state when mutation starts
      setIsBatchFetching(true)
      console.log(`🚀 Starting batch fetch mutation for ${format(fromDate, 'MMM yyyy')}`)
    },
    onSuccess: (result) => {
      const { commits, batchInfo } = result
      const source = result.metadata?.commits?.source || 'unknown'
      const count = result.metadata?.commits?.count || 0

      console.log(`🎯 Next batch completed: ${count} commits from ${source}`)

      // Add the new batch to loaded batches
      if (batchInfo) {
        setLoadedBatches(prev => [...prev, {
          ...batchInfo,
          commitCount: count
        }])

        // Track the fetched date range to prevent duplicates
        setFetchedDateRanges(prev => [...prev, {
          startDate: batchInfo.startDate,
          endDate: batchInfo.endDate
        }])

        console.log(`📅 Added fetched range: ${format(batchInfo.startDate, 'MMM yyyy')} → ${format(batchInfo.endDate, 'MMM yyyy')}`)
      }

      // Merge new commits with existing ones (avoiding duplicates)
      const existingCommits = commitResponse?.commits || []
      const mergedCommits = [...existingCommits]

      commits.forEach((newCommit: Commit) => {
        const exists = existingCommits.some((existing: Commit) =>
          existing.sha === newCommit.sha && existing.repoName === newCommit.repoName
        )
        if (!exists) {
          mergedCommits.push(newCommit)
        }
      })

      // Sort by date (newest first)
      mergedCommits.sort((a: Commit, b: Commit) => {
        const dateA = new Date(a.date || a.commit.author.date)
        const dateB = new Date(b.date || b.commit.author.date)
        return dateB.getTime() - dateA.getTime()
      })

      // Update oldest commit date
      if (mergedCommits.length > 0) {
        const oldestDate = new Date(mergedCommits[mergedCommits.length - 1].date || mergedCommits[mergedCommits.length - 1].commit.author.date)
        setOldestCommitDate(oldestDate)

        // Update the 1000th commit date to the new boundary
        // If we have more than 1000 commits, the 1000th is at index 999 (0-based)
        if (mergedCommits.length >= 1000) {
          const newThousandthCommit = mergedCommits[999] // 1000th commit (0-based index)
          const newThousandthDate = new Date(newThousandthCommit.date || newThousandthCommit.commit.author.date)
          setThousandthCommitDate(newThousandthDate)
          console.log(`🎯 Updated 1000th commit date to: ${format(newThousandthDate, 'MMM yyyy')}`)
        }
      }

      // Update the main query cache with merged data
      queryClient.setQueryData(
        ['all-commits-paginated', user?.id, maxCommitsPerRepo],
        {
          ...commitResponse,
          commits: mergedCommits,
          metadata: {
            ...commitResponse?.metadata,
            commits: {
              ...commitResponse?.metadata?.commits,
              count: mergedCommits.length
            }
          }
        }
      )

      toast({
        title: 'More commits loaded',
        description: `Loaded ${count} additional commits going back to ${format(batchInfo?.startDate || new Date(), 'MMM yyyy')}`,
      })
    },
    onError: (error) => {
      console.error('❌ Next batch fetch failed:', error)
      toast({
        title: 'Failed to load more commits',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      // Always clear fetching state when mutation completes (success or error)
      setIsBatchFetching(false)
      console.log(`✅ Batch fetch mutation settled, clearing isBatchFetching`)
    }
  })

  // Check if we have commits for a specific month
  const hasCommitsForMonth = useCallback((targetDate: Date) => {
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)

    return filteredCommits.some((commit: Commit) => {
      const commitDate = new Date(commit.date || commit.commit.author.date)
      return commitDate >= startOfMonth && commitDate <= endOfMonth
    })
  }, [filteredCommits])

  const handleRepoSelect = (repoId: string) => {
    if (repoId === 'all') {
      setSelectedRepo(null)
    } else {
      const repo = repos.find((r) => r.id === repoId)
      setSelectedRepo(repo || null)
    }
  }

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    setSelectedDate(dateStr)

    // Get commits for this specific date
    const dayCommits = filteredCommits.filter((commit: Commit) => {
      const commitDate = (commit.date || commit.commit.author.date)?.split('T')[0]
      return commitDate === dateStr
    })

    setCommitDetails(dayCommits)
    setOpen(true)
  }

  const handleCommitClick = (commit: Commit) => {
    const commitDate = (commit.date || commit.commit.author.date)?.split('T')[0]
    if (commitDate) {
      setSelectedDate(commitDate)

      // Get all commits for this date
      const dayCommits = filteredCommits.filter((c: Commit) => {
        const cDate = (c.date || c.commit.author.date)?.split('T')[0]
        return cDate === commitDate
      })

      setCommitDetails(dayCommits)
      setOpen(true)
    }
  }

  const handleDateSelect = (date?: Date) => {
    if (date) {
      setCurrentDate(date)
      handleDateClick(date)
    }
  }

  const handleForceRefresh = () => {
    forceRefreshMutation.mutate()
  }

  const handleLoadMore = () => {
    const newMax = maxCommitsPerRepo + 1000
    setMaxCommitsPerRepo(newMax)
    loadMoreMutation.mutate(newMax)
  }

  const handleCalendarNavigate = (date: Date) => {
    console.log(`📅 Calendar navigated to: ${format(date, 'MMM yyyy')}`)
    setCurrentDate(date)

    // CORRECTED LOGIC:
    // 1. Only fetch when navigating PAST the 1000th commit boundary (to older dates)
    // 2. Only fetch if the target date is NOT already covered by fetched ranges
    // 3. Only fetch if we have 1000+ commits (suggesting we hit the limit)

    const isPastBoundary = isNavigatingPastBoundary(date)
    const isAlreadyCovered = isDateCovered(date)
    const hasNearFullDataset = commitData.length >= 1000
    const isInitialLoad = commitData.length === 0
    const isAlreadyFetching = nextBatchMutation.isPending || isBatchFetching

    console.log(`🔍 Navigation analysis for ${format(date, 'MMM yyyy')}:`, {
      isPastBoundary,
      isAlreadyCovered,
      hasNearFullDataset,
      thousandthCommitDate: thousandthCommitDate ? format(thousandthCommitDate, 'MMM yyyy') : 'none',
      totalCommits: commitData.length,
      isAlreadyFetching,
      fetchedRanges: fetchedDateRanges.length
    })

    // Only fetch if ALL conditions are met:
    // 1. Navigating past the 1000th commit boundary
    // 2. Date is NOT already covered by fetched ranges
    // 3. We have a full dataset (1000+ commits)
    // 4. Not during initial load
    // 5. Not already fetching
    const shouldFetchNextBatch =
      isPastBoundary &&
      !isAlreadyCovered &&
      hasNearFullDataset &&
      !isInitialLoad &&
      !isAlreadyFetching

    if (shouldFetchNextBatch) {
      console.log(`🔄 Navigating past boundary to uncovered date, fetching next batch...`)

      toast({
        title: 'Loading older commits',
        description: `Fetching commits older than ${format(thousandthCommitDate!, 'MMM yyyy')}...`,
      })

      // Fetch the next batch starting from the 1000th commit date
      nextBatchMutation.mutate(thousandthCommitDate!)
    } else if (isAlreadyFetching) {
      console.log(`⏳ Already fetching next batch, skipping request for ${format(date, 'MMM yyyy')}`)
    } else if (!hasNearFullDataset) {
      console.log(`📊 Dataset is small (${commitData.length} commits), no batch fetch needed`)
    } else if (!isPastBoundary) {
      console.log(`📅 Not past boundary yet (within loaded commits), no fetch needed`)
    } else if (isAlreadyCovered) {
      console.log(`✅ Date already covered by fetched ranges, no fetch needed`)
    } else {
      console.log(`✅ Navigation handled without fetching`)
    }
  }

  // Check for authentication errors
  const isAuthError = isError && error instanceof Error && (
    error.message?.includes('Unauthorized') ||
    error.message?.includes('GitHub token') ||
    error.message?.includes('authRequired')
  )

  // Handle authentication redirect
  const handleGoToLogin = () => {
    router.push('/login')
  }

  // Show loading screen while fetching initial data
  if (isLoading) {
    return (
      <LoadingScreen
        title="Loading Your Development Timeline"
        subtitle="Fetching your complete commit history from GitHub..."
        showCalendarTips={true}
      />
    )
  }

  // Show authentication required screen
  if (isAuthError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-md">
          <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              GitHub Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please authenticate with GitHub to access your commit history.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              You'll need to connect your GitHub account to view and sync your repositories.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGoToLogin}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Github className="w-4 h-4" />
              Connect GitHub Account
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Try Again
            </Button>
          </div>

          {error && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Commit Calendar
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Your complete GitHub commit history
              </p>
              {commitData.length > 0 && (
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{commitData.length} total commits</span>
                  {selectedRepo && (
                    <span>• {filteredCommits.length} in {selectedRepo.name}</span>
                  )}
                  {paginationInfo && paginationInfo.limitedRepositories > 0 && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      {paginationInfo.limitedRepositories} repos limited
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Repository Filter */}
              <div className="min-w-[240px]">
                <SelectComponent
                  placeholder="Select repository"
                  options={[
                    { value: 'all', label: '🗂️ All Repositories' },
                    ...repos?.map((repo) => ({
                      value: repo.id,
                      label: `📁 ${repo.name}`,
                    })),
                  ]}
                  value={selectedRepo ? selectedRepo.id : 'all'}
                  onChange={handleRepoSelect}
                  disabled={!user}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleForceRefresh}
                  disabled={forceRefreshMutation.isPending}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${forceRefreshMutation.isPending ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <CalendarDaysIcon className="w-4 h-4" />
                      {selectedDate ? format(new Date(selectedDate), 'MMM d') : 'Jump to date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate ? new Date(selectedDate) : undefined}
                      onSelect={handleDateSelect}
                      className="rounded-md border shadow-lg"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {lastSyncTime && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Last updated {format(new Date(lastSyncTime), 'MMM d, HH:mm')}</span>
                </div>
              )}

              {/* Pagination Stats */}
              {paginationInfo && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>•</span>
                  <span>{paginationInfo.totalRepositories} repositories</span>
                  {paginationInfo.limitedRepositories > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-yellow-600">
                        {paginationInfo.limitedRepositories} with {maxCommitsPerRepo}+ commits
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Loaded batches indicator */}
              {loadedBatches.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>•</span>
                  <span>{loadedBatches.length} batch{loadedBatches.length > 1 ? 'es' : ''} loaded</span>
                </div>
              )}

              {/* Debug: Show 1000th commit date tracking */}
              {thousandthCommitDate && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <span>•</span>
                  <span>1000th: {format(thousandthCommitDate, 'MMM yyyy')}</span>
                </div>
              )}

              {/* Fetched ranges indicator */}
              {fetchedDateRanges.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                  <span>•</span>
                  <span>{fetchedDateRanges.length} range{fetchedDateRanges.length > 1 ? 's' : ''} fetched</span>
                </div>
              )}

              {/* Next batch fetching indicator */}
              {isBatchFetching && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                  <span>•</span>
                  <LoadingSpinner className="w-3 h-3" />
                  <span>Loading {format(currentDate, 'MMM yyyy')}</span>
                </div>
              )}
            </div>

            {/* Load More Button */}
            {paginationInfo && paginationInfo.limitedRepositories > 0 && (
              <Button
                onClick={handleLoadMore}
                disabled={loadMoreMutation.isPending}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {loadMoreMutation.isPending ? (
                  <LoadingSpinner className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Load More Commits
              </Button>
            )}
          </div>
        </div>

        {/* Limited Repositories Warning */}
        {paginationInfo && paginationInfo.limitedRepositories > 0 && (
          <div className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-yellow-800 dark:text-yellow-200">
                <strong>{paginationInfo.limitedRepositories} repositories</strong> have more than {maxCommitsPerRepo} commits.
                Only the most recent {maxCommitsPerRepo} commits are shown for each.
                <Button
                  variant="link"
                  className="p-0 h-auto text-yellow-800 dark:text-yellow-200 underline"
                  onClick={handleLoadMore}
                  disabled={loadMoreMutation.isPending}
                >
                  Load more commits
                </Button>
              </p>
            </div>
          </div>
        )}

        {/* Calendar Section */}
        <div className="relative">
          {/* Next batch fetch indicator */}
          {isBatchFetching && (
            <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <div className="flex items-center gap-3">
                <LoadingSpinner className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                    Loading commits for {format(currentDate, 'MMM yyyy')}
                  </h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                    Fetching commit history from GitHub API...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Commits Notice */}
          {commitData.length === 0 && !isLoading && !isFetching && !isBatchFetching && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <CalendarDaysIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    No commits found
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Try clicking the <strong>Refresh</strong> button to sync with GitHub, or check if you have any repositories connected.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CommitCalendar */}
          <CommitCalendar
            commits={filteredCommits}
            selectedRepo={selectedRepo}
            isLoading={isLoading || isFetching}
            onRefresh={handleForceRefresh}
            onDateClick={handleDateClick}
            onCommitClick={handleCommitClick}
            onCalendarNavigate={handleCalendarNavigate}
            initialView={currentView === 'dayGridMonth' ? 'month' : currentView === 'dayGridWeek' ? 'week' : 'month'}
            initialDate={currentDate}
          />

          {/* Refresh Loading Overlay */}
          {forceRefreshMutation.isPending && (
            <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
              <div className="flex flex-col items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <LoadingSpinner />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Refreshing data...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        <ModalCommits
          open={open}
          setOpen={setOpen}
          selectedDate={selectedDate}
          commitDetails={commitDetails}
          isLoading={isLoading}
          isError={isError}
          error={error}
        />
      </div>
    </ProtectedRoute>
  )
}

export default CalendarPage