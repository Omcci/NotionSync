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
import { Github, AlertCircle, ChevronDown, ExternalLink, Database } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { CommitCalendar } from '@/components/calendar/CommitCalendar'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Fetch commits from database with automatic pagination
const fetchCommitsFromDatabase = async (
  userId: string,
  startDate: string,
  endDate: string,
  sync: boolean = false,
  githubToken?: string
) => {
  // Early validation
  if (!userId) {
    throw new Error('User ID is required')
  }

  if (sync && !githubToken) {
    throw new Error('GitHub token is required for sync operations')
  }

  const params = new URLSearchParams({
    userId,
    startDate,
    endDate,
    sync: sync.toString(),
    useTimePagination: 'true',
    monthsBack: '12' // Default to 12 months for initial load
  })

  console.log(`🗄️ Fetching commits from database:`, {
    userId,
    startDate,
    endDate,
    sync,
    useTimePagination: true,
    monthsBack: 12,
    hasToken: !!githubToken
  })

  const headers: Record<string, string> = {}
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`
  }

  const response = await fetch(`/api/commits/database?${params}`, {
    headers
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
    throw new Error(`Error fetching commits: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  return result
}

const CalendarPage = () => {
  const [filteredCommits, setFilteredCommits] = useState<Commit[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [commitDetails, setCommitDetails] = useState<Commit[]>([])
  const [open, setOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [isNavigating, setIsNavigating] = useState(false)
  const [dataUpdateTrigger, setDataUpdateTrigger] = useState(0)

  // Initialize with current month ± 2 months for better performance
  const [dateRange, setDateRange] = useState(() => ({
    startDate: (() => {
      const date = new Date()
      date.setMonth(date.getMonth() - 2)
      return date
    })(),
    endDate: (() => {
      const date = new Date()
      date.setMonth(date.getMonth() + 2)
      return date
    })()
  }))

  const { user, githubToken } = useUser()
  const { repos, selectedRepo, setSelectedRepo, isLoadingRepos } = useAppContext()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()

  // Main query for fetching commits from database
  const {
    data: commitResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['database-commits', user?.id, dateRange.startDate.toISOString().split('T')[0], dateRange.endDate.toISOString().split('T')[0]],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated')
      if (!githubToken) throw new Error('GitHub token not available')



      return fetchCommitsFromDatabase(
        user.id,
        dateRange.startDate.toISOString(),
        dateRange.endDate.toISOString(),
        false, // Don't sync by default to avoid rate limits
        githubToken
      )
    },
    enabled: !!user?.id && !!githubToken, // Only enable if user is authenticated AND has GitHub token
    staleTime: 1000 * 60 * 15, // Consider data stale after 15 minutes
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
  const commitData = useMemo(() => {
    const commits = commitResponse?.commits || []
    console.log(`🔄 Commit data updated: ${commits.length} commits`)
    // Trigger a re-render when commits change
    setDataUpdateTrigger(prev => prev + 1)
    return commits
  }, [commitResponse?.commits])



  // Auto-load mutation for when user navigates to dates outside current range
  const autoLoadMutation = useMutation({
    mutationFn: async (direction: 'older' | 'newer') => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // Check if we have a valid GitHub token
      if (!githubToken) {
        throw new Error('GitHub token not found. Please re-authenticate.')
      }

      // Calculate new date range - extend by 1 month for more targeted loading
      let newStartDate = dateRange.startDate
      let newEndDate = dateRange.endDate

      if (direction === 'older') {
        // Extend backwards by 1 month
        newStartDate = new Date(dateRange.startDate)
        newStartDate.setMonth(newStartDate.getMonth() - 1)
      } else {
        // Extend forwards by 1 month
        newEndDate = new Date(dateRange.endDate)
        newEndDate.setMonth(newEndDate.getMonth() + 1)
      }

      // Fetch commits for the new range
      const params = new URLSearchParams({
        userId: user.id,
        startDate: newStartDate.toISOString(),
        endDate: newEndDate.toISOString(),
        sync: 'false', // Don't sync when auto-loading to avoid rate limits
        useTimePagination: 'true',
        monthsBack: '1' // Fetch 1 month at a time for better performance
      })

      const response = await fetch(`/api/commits/database?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to load commits')
      }

      return await response.json()
    },
    onSuccess: (result, direction) => {
      const count = result.summary?.totalCommits || 0
      const returnedCount = result.summary?.returnedCommits || count
      const hasMore = result.summary?.hasMoreCommits || false

      // Calculate the new date range
      let updatedStartDate = dateRange.startDate
      let updatedEndDate = dateRange.endDate

      if (direction === 'older') {
        // Extend backwards by 1 month
        updatedStartDate = new Date(dateRange.startDate)
        updatedStartDate.setMonth(updatedStartDate.getMonth() - 1)
      } else {
        // Extend forwards by 1 month
        updatedEndDate = new Date(dateRange.endDate)
        updatedEndDate.setMonth(updatedEndDate.getMonth() + 1)
      }

      // Update date range state
      setDateRange(prev => ({
        startDate: updatedStartDate,
        endDate: updatedEndDate
      }))

      console.log(`✅ Auto-loaded ${returnedCount} commits (${direction === 'older' ? '1 month back' : '1 month forward'})`)
      if (hasMore) {
        console.log(`📊 ${count - returnedCount} more commits available in database`)
      }

      // Invalidate the query for the updated date range
      const newStartDate = updatedStartDate.toISOString().split('T')[0]
      const newEndDate = updatedEndDate.toISOString().split('T')[0]

      console.log(`🔄 Invalidating cache for date range: ${newStartDate} to ${newEndDate}`)

      // Invalidate all database-commits queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['database-commits']
      })

      // Also trigger a refetch of the main query
      queryClient.refetchQueries({
        queryKey: ['database-commits', user?.id]
      })
    },
    onError: (error) => {
      console.error('Auto-load failed:', error)

      // Handle authentication errors specifically
      if (error instanceof Error && error.message.includes('GitHub token')) {
        toast({
          title: 'Authentication required',
          description: 'Please re-authenticate with GitHub to load more commits.',
          variant: 'destructive',
        })
        router.push('/login')
        return
      }

      toast({
        title: 'Failed to load commits',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setIsNavigating(false)
    }
  })

  const handleRepoSelect = useCallback((repoId: string) => {
    if (repoId === 'all') {
      setSelectedRepo(null)
    } else {
      const repo = repos.find((r) => r.id === repoId)
      setSelectedRepo(repo || null)
    }
  }, [repos, setSelectedRepo])

  const handleDateClick = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    setSelectedDate(dateStr)

    // Get commits for this specific date
    const dayCommits = filteredCommits.filter((commit: Commit) => {
      const commitDate = (commit.date || commit.commit.author.date)?.split('T')[0]
      return commitDate === dateStr
    })

    setCommitDetails(dayCommits)
    setOpen(true)
  }, [filteredCommits])

  const handleCommitClick = useCallback((commit: Commit) => {
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
  }, [filteredCommits])

  const handleCalendarNavigate = useCallback((date: Date) => {
    console.log(`📅 Calendar navigated to: ${format(date, 'MMM yyyy')}`)

    // Prevent multiple navigation calls
    if (isNavigating || autoLoadMutation.isPending) {
      console.log('🚫 Navigation blocked - already loading')
      return
    }

    setCurrentDate(date)

    // Check if we need to load more data for this date
    const isOutsideRange = date < dateRange.startDate || date > dateRange.endDate

    if (isOutsideRange) {
      console.log(`📅 Date ${format(date, 'MMM yyyy')} is outside loaded range, auto-loading more data`)
      setIsNavigating(true)

      // Auto-load more data
      if (date < dateRange.startDate) {
        console.log('🔄 Auto-loading older commits...')
        autoLoadMutation.mutate('older')
      } else {
        console.log('🔄 Auto-loading newer commits...')
        autoLoadMutation.mutate('newer')
      }
    } else {
      console.log(`📅 Date ${format(date, 'MMM yyyy')} is within loaded range, forcing data refresh`)

      // Force a complete cache invalidation and refetch to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ['database-commits', user?.id]
      })

      // Also refetch the specific query
      queryClient.refetchQueries({
        queryKey: ['database-commits', user?.id, dateRange.startDate.toISOString().split('T')[0], dateRange.endDate.toISOString().split('T')[0]]
      })
    }
  }, [dateRange, autoLoadMutation, isNavigating, queryClient, user?.id])

  // Check for authentication errors
  const isAuthError = isError && error instanceof Error && (
    error.message?.includes('Unauthorized') ||
    error.message?.includes('GitHub token') ||
    error.message?.includes('authRequired')
  )

  // Filter commits based on selected repository and current month
  useEffect(() => {
    console.log(`🔍 Filtering commits: ${commitData.length} total, selectedRepo: ${selectedRepo?.name || 'all'}, currentDate: ${format(currentDate, 'MMM yyyy')}`)

    let filtered = commitData

    // Filter by selected repository
    if (selectedRepo) {
      filtered = filtered.filter((commit: Commit) => commit.repoName === selectedRepo.name)
      console.log(`📊 Filtered to ${filtered.length} commits for ${selectedRepo.name}`)
    }

    // Filter by current month (optional - uncomment if you want to show only current month)
    // const currentMonth = currentDate.getMonth()
    // const currentYear = currentDate.getFullYear()
    // filtered = filtered.filter((commit: Commit) => {
    //   const commitDate = new Date(commit.date || commit.commit?.author?.date)
    //   return commitDate.getMonth() === currentMonth && commitDate.getFullYear() === currentYear
    // })

    console.log(`📊 Final filtered commits: ${filtered.length}`)
    setFilteredCommits(filtered)
    console.log(`📊 Set filteredCommits to: ${filtered.length} commits`)
  }, [commitData, selectedRepo, currentDate, dataUpdateTrigger])



  // Handle authentication errors
  useEffect(() => {
    if (isAuthError) {
      toast({
        title: 'Authentication required',
        description: 'Please re-authenticate with GitHub to continue.',
        variant: 'destructive',
      })
      router.push('/login')
    }
  }, [isAuthError, toast, router])

  // Memoize modal props to prevent infinite re-renders
  const modalProps = useMemo(() => ({
    open,
    setOpen,
    selectedDate,
    commitDetails,
    isLoading: isLoading || isFetching || autoLoadMutation.isPending,
    isError,
    error
  }), [open, setOpen, selectedDate, commitDetails, isLoading, isFetching, autoLoadMutation.isPending, isError, error])

  if (!user) {
    return <LoadingScreen />
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Commit Calendar
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Visualize your GitHub commit history across all repositories
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Database className="w-4 h-4" />
                  <span>{commitData.length} commits loaded</span>
                </div>


              </div>
            </div>

            {/* Repository Filter */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Repository:
                </span>
              </div>
              <SelectComponent
                value={selectedRepo?.id || 'all'}
                onChange={handleRepoSelect}
                options={[
                  { value: 'all', label: 'All Repositories' },
                  ...repos.map((repo) => ({
                    value: repo.id,
                    label: `${repo.owner}/${repo.name}`,
                  })),
                ]}
                placeholder="Select repository"
              />
            </div>

            {/* No Repositories Message */}
            {repos.length === 0 && !isLoadingRepos && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                    <Github className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      No repositories found
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      It looks like you haven't synced your GitHub repositories yet. Please visit the settings page to sync your repositories.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Information */}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>📅 Date range:</span>
                <span className="font-medium">
                  {format(dateRange.startDate, 'MMM yyyy')} - {format(dateRange.endDate, 'MMM yyyy')}
                </span>
              </div>
              {autoLoadMutation.isPending && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <LoadingSpinner className="w-4 h-4" />
                  <span>Loading more commits...</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {isError && !isAuthError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                    Error loading commits
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {(isLoading || isFetching) && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3">
                <LoadingSpinner className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Loading commits...
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Fetching commit data from your repositories
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Commits Message */}
          {commitData.length === 0 && !isLoading && !isFetching && !autoLoadMutation.isPending && (
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
                    Navigate to different months to automatically load commits from your repositories.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CommitCalendar */}
          <CommitCalendar
            key={`calendar-${dataUpdateTrigger}`}
            commits={filteredCommits}
            selectedRepo={selectedRepo}
            isLoading={isLoading || isFetching || autoLoadMutation.isPending}
            onDateClick={handleDateClick}
            onCommitClick={handleCommitClick}
            onCalendarNavigate={handleCalendarNavigate}
            initialView="month"
            initialDate={currentDate}
          />
          {/* Debug info */}
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
            <div>Debug Info:</div>
            <div>commitData: {commitData.length} commits</div>
            <div>filteredCommits: {filteredCommits.length} commits</div>
            <div>dataUpdateTrigger: {dataUpdateTrigger}</div>
            <div>currentDate: {format(currentDate, 'MMM yyyy')}</div>
          </div>

          {/* Refresh Loading Overlay */}
          {autoLoadMutation.isPending && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <LoadingSpinner className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Loading commits...
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Fetching commits for the new date range
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Commit Details Modal */}
        <ModalCommits {...modalProps} />
      </div>
    </ProtectedRoute>
  )
}

export default CalendarPage