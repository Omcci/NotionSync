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
import { RefreshCw, Github, AlertCircle, ChevronDown, ExternalLink, Database } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { CommitCalendar } from '@/components/calendar/CommitCalendar'
import { useRouter } from 'next/router'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Fetch commits from database with optional sync
const fetchCommitsFromDatabase = async (
  userId: string,
  startDate?: string,
  endDate?: string,
  sync: boolean = false
) => {
  const githubToken = await getGitHubToken()

  // Default to a wide date range if not specified
  const defaultEndDate = endDate || new Date().toISOString()
  const defaultStartDate = startDate || (() => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 5) // 5 years back
    return date.toISOString()
  })()

  const params = new URLSearchParams({
    userId,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    sync: sync.toString()
  })

  console.log(`🗄️ Fetching commits from database:`, {
    userId,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    sync
  })

  const response = await fetch(`/api/commits/database?${params}`, {
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
    throw new Error(`Error fetching commits: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  console.log(`✅ Successfully fetched commits from database:`, {
    totalCommits: result.metadata?.count || 0,
    source: result.metadata?.source || 'unknown',
    lastUpdated: result.metadata?.lastUpdated
  })

  return result
}

// Fetch commits for a specific date range (for pagination)
const fetchCommitsForDateRange = async (
  userId: string,
  startDate: string,
  endDate: string,
  sync: boolean = false
) => {
  return fetchCommitsFromDatabase(userId, startDate, endDate, sync)
}

const CalendarPage = () => {
  const [filteredCommits, setFilteredCommits] = useState<Commit[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [commitDetails, setCommitDetails] = useState<Commit[]>([])
  const [open, setOpen] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<string>('dayGridMonth')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // Simplified state - no complex batching
  const [dateRange, setDateRange] = useState({
    startDate: (() => {
      const date = new Date()
      date.setFullYear(date.getFullYear() - 5)
      return date
    })(),
    endDate: new Date()
  })

  const { user, githubToken } = useUser()
  const { repos, selectedRepo, setSelectedRepo } = useAppContext()
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
    queryKey: ['database-commits', user?.id, dateRange.startDate.toISOString(), dateRange.endDate.toISOString()],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated')
      return fetchCommitsFromDatabase(
        user.id,
        dateRange.startDate.toISOString(),
        dateRange.endDate.toISOString(),
        false // Don't sync by default
      )
    },
    enabled: !!user?.id,
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
  const commitData = useMemo(() => commitResponse?.commits || [], [commitResponse?.commits])
  const metadata = commitResponse?.metadata

  // Update last sync time
  useEffect(() => {
    if (metadata?.lastUpdated) {
      setLastSyncTime(metadata.lastUpdated)
    }
  }, [metadata])

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
      console.log(`  - Date range: ${format(dateRange.startDate, 'MMM yyyy')} → ${format(dateRange.endDate, 'MMM yyyy')}`)

      // Show breakdown by repository
      const repoBreakdown = commitData.reduce((acc: Record<string, number>, commit: Commit) => {
        const repoName = commit.repoName || 'Unknown'
        acc[repoName] = (acc[repoName] || 0) + 1
        return acc
      }, {})
      console.log(`  - Repository breakdown:`, repoBreakdown)
    }
  }, [commitData, selectedRepo, dateRange])

  // Mutation for force refresh (sync with GitHub)
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return await fetchCommitsFromDatabase(
        user.id,
        dateRange.startDate.toISOString(),
        dateRange.endDate.toISOString(),
        true // Force sync with GitHub
      )
    },
    onSuccess: (result) => {
      setLastSyncTime(new Date().toISOString())

      const source = result.metadata?.source || 'unknown'
      const count = result.metadata?.count || 0

      toast({
        title: 'Calendar synced',
        description: `Synced ${count} commits from GitHub to database`,
      })

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['database-commits'] })
    },
    onError: (error) => {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    },
  })

  // Mutation for loading more commits (expand date range)
  const loadMoreMutation = useMutation({
    mutationFn: async (direction: 'older' | 'newer') => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      let newStartDate = dateRange.startDate
      let newEndDate = dateRange.endDate

      if (direction === 'older') {
        // Extend backwards by 2 years
        newStartDate = new Date(dateRange.startDate)
        newStartDate.setFullYear(newStartDate.getFullYear() - 2)
      } else {
        // Extend forwards by 1 year
        newEndDate = new Date(dateRange.endDate)
        newEndDate.setFullYear(newEndDate.getFullYear() + 1)
      }

      return await fetchCommitsForDateRange(
        user.id,
        newStartDate.toISOString(),
        newEndDate.toISOString(),
        true // Sync to get new data
      )
    },
    onSuccess: (result, direction) => {
      const count = result.metadata?.count || 0

      // Update date range
      if (direction === 'older') {
        const newStartDate = new Date(dateRange.startDate)
        newStartDate.setFullYear(newStartDate.getFullYear() - 2)
        setDateRange(prev => ({ ...prev, startDate: newStartDate }))
      } else {
        const newEndDate = new Date(dateRange.endDate)
        newEndDate.setFullYear(newEndDate.getFullYear() + 1)
        setDateRange(prev => ({ ...prev, endDate: newEndDate }))
      }

      toast({
        title: 'More commits loaded',
        description: `Loaded ${count} commits going ${direction === 'older' ? 'back' : 'forward'} in time`,
      })

      queryClient.invalidateQueries({ queryKey: ['database-commits'] })
    },
    onError: (error) => {
      toast({
        title: 'Failed to load more commits',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    },
  })

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
    syncMutation.mutate()
  }

  const handleLoadOlder = () => {
    loadMoreMutation.mutate('older')
  }

  const handleLoadNewer = () => {
    loadMoreMutation.mutate('newer')
  }

  const handleCalendarNavigate = (date: Date) => {
    console.log(`📅 Calendar navigated to: ${format(date, 'MMM yyyy')}`)
    setCurrentDate(date)

    // Check if we need to load more data for this date
    const isOutsideRange = date < dateRange.startDate || date > dateRange.endDate

    if (isOutsideRange) {
      console.log(`📅 Date ${format(date, 'MMM yyyy')} is outside loaded range, consider loading more data`)

      // Optionally auto-load more data
      if (date < dateRange.startDate) {
        toast({
          title: 'Viewing older dates',
          description: `Click "Load Older" to fetch commits before ${format(dateRange.startDate, 'MMM yyyy')}`,
        })
      } else {
        toast({
          title: 'Viewing newer dates',
          description: `Click "Load Newer" to fetch commits after ${format(dateRange.endDate, 'MMM yyyy')}`,
        })
      }
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
        subtitle="Fetching your complete commit history from database..."
        showCalendarTips={true}
      />
    )
  }

  // Show authentication error
  if (isAuthError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-red-900 dark:to-gray-900">
        <div className="min-h-screen grid place-items-center p-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-200/50 dark:border-red-700/50 p-8 text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Authentication Required
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error?.message || 'Please log in with GitHub to access your commits'}
            </p>
            <Button onClick={handleGoToLogin} className="w-full">
              <Github className="w-4 h-4 mr-2" />
              Go to Login
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
                Your complete GitHub commit history from database
              </p>
              {commitData.length > 0 && (
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{commitData.length} total commits</span>
                  {selectedRepo && (
                    <span>• {filteredCommits.length} in {selectedRepo.name}</span>
                  )}
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <Database className="w-3 h-3 mr-1" />
                    Database
                  </Badge>
                  <span>• {format(dateRange.startDate, 'MMM yyyy')} → {format(dateRange.endDate, 'MMM yyyy')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Repository Filter */}
              <div className="min-w-[200px]">
                <SelectComponent
                  options={[
                    { value: 'all', label: 'All Repositories' },
                    ...repos.map((repo) => ({
                      value: repo.id,
                      label: repo.name,
                    })),
                  ]}
                  value={selectedRepo?.id || 'all'}
                  onChange={handleRepoSelect}
                  placeholder="Select repository"
                />
              </div>

              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal">
                    <CalendarDaysIcon className="mr-2 h-4 w-4" />
                    {format(currentDate, 'PPP')}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleForceRefresh}
                  disabled={syncMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  {syncMutation.isPending ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync
                </Button>

                <Button
                  onClick={handleLoadOlder}
                  disabled={loadMoreMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  Load Older
                </Button>

                <Button
                  onClick={handleLoadNewer}
                  disabled={loadMoreMutation.isPending}
                  variant="outline"
                  size="sm"
                >
                  Load Newer
                </Button>
              </div>
            </div>
          </div>

          {/* Status Information */}
          {lastSyncTime && (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Last updated: {format(new Date(lastSyncTime), 'PPpp')}
            </div>
          )}
        </div>

        {/* Calendar Section */}
        <div className="relative">
          {/* Sync Loading Indicator */}
          {syncMutation.isPending && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3">
                <LoadingSpinner className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Syncing with GitHub
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Fetching latest commits and storing in database...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Load More Loading Indicator */}
          {loadMoreMutation.isPending && (
            <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <div className="flex items-center gap-3">
                <LoadingSpinner className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                    Loading more commits
                  </h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                    Expanding date range and syncing with GitHub...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No Commits Notice */}
          {commitData.length === 0 && !isLoading && !isFetching && !syncMutation.isPending && (
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
                    Try clicking the <strong>Sync</strong> button to fetch commits from GitHub, or check if you have any repositories connected.
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
          {syncMutation.isPending && (
            <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
              <div className="flex flex-col items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <LoadingSpinner />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Syncing with GitHub...
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