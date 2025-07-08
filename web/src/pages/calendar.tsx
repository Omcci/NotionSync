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
    githubToken?: string,
    backfill: boolean = false
) => {
    // Early validation
    if (!userId) {
        throw new Error('User ID is required')
    }

    if ((sync || backfill) && !githubToken) {
        throw new Error('GitHub token is required for sync or backfill operations')
    }

    const params = new URLSearchParams({
        userId,
        startDate,
        endDate,
        sync: sync.toString(),
        useTimePagination: 'true',
        monthsBack: '36', // Increased to 36 months for better coverage
        backfill: backfill.toString()
    })

    console.log(`🗄️ Fetching commits from database:`, {
        userId,
        startDate,
        endDate,
        sync,
        backfill,
        useTimePagination: true,
        monthsBack: 36,
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
    const [selectedDate, setSelectedDate] = useState('')
    const [commitDetails, setCommitDetails] = useState<Commit[]>([])
    const [open, setOpen] = useState(false)
    const [currentDate, setCurrentDate] = useState<Date>(new Date())

    const { user, githubToken } = useUser()
    const { repos, selectedRepo, setSelectedRepo, isLoadingRepos } = useAppContext()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const router = useRouter()

    // Single comprehensive query that loads all commits (extended date range)
    const {
        data: commitResponse,
        isLoading,
        isError,
        error,
        isFetching,
    } = useQuery({
        queryKey: ['all-commits', user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error('User not authenticated')
            if (!githubToken) throw new Error('GitHub token not available')

            // Load a comprehensive date range to avoid multiple queries
            const startDate = new Date()
            startDate.setFullYear(startDate.getFullYear() - 2) // 2 years back

            const endDate = new Date()
            endDate.setFullYear(endDate.getFullYear() + 1) // 1 year forward

            return fetchCommitsFromDatabase(
                user.id,
                startDate.toISOString(),
                endDate.toISOString(),
                false,
                githubToken,
                false // Don't backfill on initial load
            )
        },
        enabled: !!user?.id && !!githubToken,
        staleTime: 1000 * 60 * 60, // 1 hour - increased from 30 minutes for better caching
        gcTime: 1000 * 60 * 60 * 24, // 24 hours - increased from 2 hours for better persistence
        refetchOnWindowFocus: false,
        refetchOnMount: 'always', // Always refetch on mount to ensure fresh data
        refetchOnReconnect: true, // Refetch when connection is restored
        retry: (failureCount, error: any) => {
            if (error?.message?.includes('authRequired') ||
                error?.message?.includes('Unauthorized') ||
                error?.message?.includes('GitHub token')) {
                return false
            }
            return failureCount < 3 // Increased retry attempts
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    })

    // Backfill mutation for fetching older commits when needed
    const backfillMutation = useMutation({
        mutationFn: async (targetDate: Date) => {
            if (!user?.id) throw new Error('User not authenticated')
            if (!githubToken) throw new Error('GitHub token not available')

            // Calculate backfill range: from target date backwards 6 months
            const backfillStartDate = new Date(targetDate)
            backfillStartDate.setMonth(backfillStartDate.getMonth() - 6)

            const backfillEndDate = new Date(targetDate)
            backfillEndDate.setMonth(backfillEndDate.getMonth() + 1)

            console.log(`🔄 Backfilling commits from ${format(backfillStartDate, 'MMM yyyy')} to ${format(backfillEndDate, 'MMM yyyy')}`)

            return fetchCommitsFromDatabase(
                user.id,
                backfillStartDate.toISOString(),
                backfillEndDate.toISOString(),
                false,
                githubToken,
                true // Enable backfill
            )
        },
        onSuccess: (result) => {
            const newCommits = result.summary?.totalCommits || 0
            console.log(`✅ Backfill completed: ${newCommits} total commits in database`)

            // Invalidate and refetch the main query to show new data
            queryClient.invalidateQueries({ queryKey: ['all-commits', user?.id] })

            if (newCommits > 0) {
                toast({
                    title: 'Commits loaded',
                    description: `Found additional commits in your history.`,
                })
            }
        },
        onError: (error) => {
            console.error('❌ Backfill failed:', error)
            toast({
                title: 'Failed to load older commits',
                description: error instanceof Error ? error.message : 'Unknown error occurred',
                variant: 'destructive',
            })
        }
    })

    // Function to check if a date has a generated summary
    const hasGeneratedSummary = useCallback((date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        // Check localStorage for stored summary
        const storedSummary = localStorage.getItem(`summary_${dateStr}`)
        return !!storedSummary
    }, [])

    // Get all dates with summaries for performance
    const datesWithSummaries = useMemo(() => {
        const dates = new Set<string>()

        // Check localStorage for all summary keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('summary_')) {
                const dateStr = key.replace('summary_', '')
                // Validate date format (YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    dates.add(dateStr)
                }
            }
        }

        return dates
    }, [])

    // Extract commits and metadata from response
    const commitData = useMemo(() => {
        const commits = commitResponse?.commits || []
        return commits
    }, [commitResponse?.commits])

    // Compute filtered commits at render time
    const filteredCommits = useMemo(() => {
        let filtered = commitData

        // Filter by selected repository
        if (selectedRepo) {
            filtered = filtered.filter((commit: Commit) => commit.repoName === selectedRepo.name)
        }

        return filtered
    }, [commitData, selectedRepo])

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

        // Get commits for this specific date from current filtered commits
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

            // Get all commits for this date from current filtered commits
            const dayCommits = filteredCommits.filter((c: Commit) => {
                const cDate = (c.date || c.commit.author.date)?.split('T')[0]
                return cDate === commitDate
            })

            setCommitDetails(dayCommits)
            setOpen(true)
        }
    }, [filteredCommits])

    const handleCalendarNavigate = useCallback((date: Date) => {
        // Update current date first
        setCurrentDate(date)

        // Check if we have commits for this month/year
        const targetYear = date.getFullYear()
        const targetMonth = date.getMonth()

        const hasCommitsForPeriod = commitData.some((commit: Commit) => {
            const commitDate = new Date(commit.date || commit.commit.author.date)
            return commitDate.getFullYear() === targetYear && commitDate.getMonth() === targetMonth
        })

        console.log(`📅 Navigated to ${format(date, 'MMM yyyy')}, hasCommits: ${hasCommitsForPeriod}`)

        // If no commits found for this period and it's in the past, trigger backfill
        if (!hasCommitsForPeriod && date < new Date() && !backfillMutation.isPending) {
            console.log(`🔄 No commits found for ${format(date, 'MMM yyyy')}, triggering backfill...`)
            backfillMutation.mutate(date)
        }
    }, [commitData, backfillMutation])

    // Check for authentication errors
    const isAuthError = isError && error instanceof Error && (
        error.message?.includes('Unauthorized') ||
        error.message?.includes('GitHub token') ||
        error.message?.includes('authRequired')
    )

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
        isLoading: isLoading || isFetching,
        isError,
        error
    }), [open, setOpen, selectedDate, commitDetails, isLoading, isFetching, isError, error])

    if (!user) {
        return <LoadingScreen />
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                        <CalendarDaysIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                            Commit Calendar
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Visualize your coding journey across repositories
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {/* Stats Cards */}
                                <div className="flex gap-3">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Database className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Commits</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {commitData.length.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Github className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Repositories</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {repos.length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Loading indicator */}
                                    {(isLoading || isFetching || backfillMutation.isPending) && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-2">
                                                <LoadingSpinner className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                <div>
                                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                                        {backfillMutation.isPending ? 'Loading history...' : 'Syncing...'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Repository Filter */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Github className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Repository:
                                </span>
                            </div>
                            <div className="flex-1 max-w-md">
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

                            {selectedRepo && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing {filteredCommits.length} commits from {selectedRepo.name}
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
                    {commitData.length === 0 && !isLoading && !isFetching && (
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
                                        No commits found in your repositories for the loaded time period.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CommitCalendar */}
                    <CommitCalendar
                        commits={filteredCommits}
                        selectedRepo={selectedRepo}
                        isLoading={isLoading || isFetching || backfillMutation.isPending}
                        onDateClick={handleDateClick}
                        onCommitClick={handleCommitClick}
                        onCalendarNavigate={handleCalendarNavigate}
                        initialView="month"
                        initialDate={currentDate}
                        datesWithSummaries={datesWithSummaries}
                    />
                </div>

                {/* Commit Details Modal */}
                <ModalCommits {...modalProps} />
            </div>
        </ProtectedRoute>
    )
}

export default CalendarPage