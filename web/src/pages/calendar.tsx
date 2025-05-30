import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Commit } from '../../types/types'
import { useAppContext } from '@/context/AppContext'
import SelectComponent from '@/components/SelectComponent'
import ModalCommits from '@/components/ModalCommits'
import { useUser } from '@/context/UserContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
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
import { RefreshCw, Github } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { CommitCalendar } from '@/components/calendar/CommitCalendar'

// Fetch commits using intelligent caching (transparent to user)
const fetchCommitsWithSmartCache = async (
  userId: string,
  dateRange: { start: string; end: string },
  forceRefresh: boolean = false
) => {
  const githubToken = await getGitHubToken()

  const params = new URLSearchParams({
    userId,
    startDate: dateRange.start,
    endDate: dateRange.end,
    forceRefresh: forceRefresh.toString(),
    // Use aggressive caching for better performance
    repositoryCacheTime: '120', // 2 hours
    commitCacheTime: '60', // 1 hour
  })

  const response = await fetch(`/api/smart-cache/commits?${params}`, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error fetching commits: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

const CalendarPage = () => {
  const [filteredCommits, setFilteredCommits] = useState<Commit[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [commitDetails, setCommitDetails] = useState<Commit[]>([])
  const [open, setOpen] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<string>('dayGridMonth')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  const { user, githubToken } = useUser()
  const { repos, selectedRepo, setSelectedRepo } = useAppContext()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Debounced date range setter to prevent excessive API calls
  const setDateRangeDebounced = useCallback((newDateRange: { start: string; end: string }) => {
    const timeoutId = setTimeout(() => {
      setDateRange(newDateRange)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [])

  // Query for fetching commits with intelligent caching
  const {
    data: commitResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['smart-commits', dateRange.start, dateRange.end],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated')

      return fetchCommitsWithSmartCache(
        user.id,
        dateRange,
        false // Don't force refresh on normal queries
      )
    },
    enabled: !!user?.id && !!dateRange.start && !!dateRange.end,
    staleTime: 1000 * 60 * 30, // Consider data stale after 30 minutes (increased for better caching)
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if we have cached data
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 1, // Reduce retry attempts for faster failure handling
    retryDelay: 1000, // 1 second retry delay
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
  })

  // Extract commits and metadata from response
  const commitData = useMemo(() => commitResponse?.commits || [], [commitResponse?.commits])
  const metadata = commitResponse?.metadata

  // Update last sync time when data changes
  useEffect(() => {
    if (metadata?.commits?.lastUpdated) {
      setLastSyncTime(metadata.commits.lastUpdated)
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
    }
  }, [commitData, selectedRepo])

  // Mutation for force refresh
  const forceRefreshMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      return await fetchCommitsWithSmartCache(
        user.id,
        dateRange,
        true // Force refresh
      )
    },
    onSuccess: (result) => {
      setLastSyncTime(new Date().toISOString())

      const source = result.metadata?.commits?.source || 'unknown'
      const count = result.metadata?.commits?.count || 0

      toast({
        title: 'Data refreshed',
        description: `Fetched ${count} commits from ${source === 'github' ? 'GitHub API' : 'cache'}`,
      })

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['smart-commits'] })
    },
    onError: (error) => {
      toast({
        title: 'Refresh failed',
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
    forceRefreshMutation.mutate()
  }

  const handleCalendarNavigate = (date: Date) => {
    // Update currentDate when calendar navigation occurs
    setCurrentDate(date)
  }

  // Initialize date range on component mount and when currentDate changes
  useEffect(() => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    // Add buffer for better data coverage
    const startDate = new Date(startOfMonth)
    startDate.setDate(startDate.getDate() - 7)

    const endDate = new Date(endOfMonth)
    endDate.setDate(endDate.getDate() + 7)

    const newDateRange = {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    }

    // Only update if different to prevent infinite loops
    if (newDateRange.start !== dateRange.start || newDateRange.end !== dateRange.end) {
      setDateRangeDebounced(newDateRange)
    }
  }, [currentDate, setDateRangeDebounced])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Commit Calendar
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your GitHub commits across repositories
            </p>
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
        {lastSyncTime && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Last updated {format(new Date(lastSyncTime), 'MMM d, HH:mm')}</span>
          </div>
        )}
      </div>

      {/* Calendar Section */}
      <div className="relative">
        {/* No Commits Notice */}
        {commitData.length === 0 && !isLoading && !isFetching && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <CalendarDaysIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  No commits found for this period
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Try clicking the <strong>Refresh</strong> button to fetch the latest data from GitHub, or select a different time period.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CommitCalendar - Replace FullCalendar */}
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

        {/* Loading Overlay - Only show when actually fetching new data */}
        {(isFetching && !commitResponse) && (
          <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
            <div className="flex flex-col items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <LoadingSpinner />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Loading commits...
              </p>
            </div>
          </div>
        )}

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
  )
}

export default CalendarPage
