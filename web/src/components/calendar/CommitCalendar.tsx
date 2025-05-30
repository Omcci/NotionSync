import React, { useMemo, useState, useEffect } from 'react'
import { Calendar, CalendarEvent } from './index'
import { Commit } from '../../../types/types'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { RefreshCw, Github } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface CommitCalendarProps {
    commits: Commit[]
    selectedRepo?: any
    isLoading?: boolean
    onRefresh?: () => void
    onDateClick?: (date: Date) => void
    onCommitClick?: (commit: Commit) => void
    className?: string
    initialView?: 'month' | 'week' | 'day'
    initialDate?: Date
    onViewChange?: (view: 'month' | 'week' | 'day') => void
    onDateChange?: (date: Date) => void
    onCalendarNavigate?: (date: Date) => void
}

export function CommitCalendar({
    commits,
    selectedRepo,
    isLoading,
    onRefresh,
    onDateClick,
    onCommitClick,
    className,
    initialView,
    initialDate,
    onViewChange,
    onDateChange,
    onCalendarNavigate
}: CommitCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
    const [popupCommits, setPopupCommits] = useState<Commit[]>([])

    // Effect to track calendar navigation and notify parent
    useEffect(() => {
        if (initialDate && onCalendarNavigate) {
            onCalendarNavigate(initialDate)
        }
    }, [initialDate, onCalendarNavigate])

    // Transform commits to calendar events
    const events = useMemo(() => {
        let commitsToUse = commits

        // Filter by selected repo
        if (selectedRepo) {
            commitsToUse = commits.filter(
                (commit: Commit) => commit.repoName === selectedRepo.name,
            )
        }

        // Group commits by date and repo
        const groupedCommits: Record<string, Record<string, Commit[]>> = {}

        for (const commit of commitsToUse) {
            const commitDate = commit.date || commit.commit.author.date
            if (commitDate && commit.repoName) {
                const date = commitDate.split('T')[0]

                if (!groupedCommits[date]) {
                    groupedCommits[date] = {}
                }

                if (!groupedCommits[date][commit.repoName]) {
                    groupedCommits[date][commit.repoName] = []
                }

                groupedCommits[date][commit.repoName].push(commit)
            }
        }

        // Create calendar events
        const calendarEvents: CalendarEvent[] = []
        for (const date in groupedCommits) {
            for (const repoName in groupedCommits[date]) {
                const repoCommits = groupedCommits[date][repoName]
                const commitCount = repoCommits.length

                let title: string
                let color: string

                // Determine color based on commit content
                const firstCommit = repoCommits[0]
                const message = firstCommit.commit?.message || ''

                if (message.toLowerCase().includes('fix') || message.toLowerCase().includes('bug')) {
                    color = '#ef4444' // Red
                } else if (message.toLowerCase().includes('feat') || message.toLowerCase().includes('add')) {
                    color = '#10b981' // Emerald
                } else if (message.toLowerCase().includes('docs') || message.toLowerCase().includes('readme')) {
                    color = '#f59e0b' // Amber
                } else if (message.toLowerCase().includes('refactor') || message.toLowerCase().includes('clean')) {
                    color = '#8b5cf6' // Violet
                } else if (message.toLowerCase().includes('test')) {
                    color = '#06b6d4' // Cyan
                } else if (message.toLowerCase().includes('style') || message.toLowerCase().includes('ui')) {
                    color = '#ec4899' // Pink
                } else {
                    color = '#6366f1' // Default indigo
                }

                // Create title
                if (selectedRepo) {
                    title = commitCount === 1
                        ? message.length > 40
                            ? `${message.substring(0, 40)}...`
                            : message
                        : `${commitCount} commits`
                } else {
                    const truncatedRepo = repoName.length > 20 ? `${repoName.substring(0, 20)}...` : repoName
                    title = commitCount === 1
                        ? `${truncatedRepo}: ${message.length > 25 ? `${message.substring(0, 25)}...` : message}`
                        : `${truncatedRepo}: ${commitCount} commits`
                }

                calendarEvents.push({
                    id: `${date}-${repoName}`,
                    title,
                    start: new Date(date),
                    end: new Date(date),
                    allDay: true,
                    color,
                    data: {
                        commits: repoCommits,
                        repoName,
                        date
                    }
                })
            }
        }

        return calendarEvents
    }, [commits, selectedRepo])

    // Custom event renderer that matches your existing design
    const renderEvent = (event: CalendarEvent, date: Date) => {
        const commits = event.data?.commits || []
        const commitCount = commits.length
        const repoName = event.data?.repoName || 'Unknown'
        const maxDisplayCommits = 3

        const displayCommits = commits.slice(0, maxDisplayCommits)

        return (
            <div className="commit-event-container relative group cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all mb-1">
                {/* Header with Repository Info */}
                <div className="commit-header flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs">📁</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                            {repoName.length > 15 ? `${repoName.substring(0, 15)}...` : repoName}
                        </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-2">
                        {commitCount}
                    </span>
                </div>

                {/* Commit List */}
                <div className="commit-list p-2 space-y-1">
                    {displayCommits.map((commit: Commit, index: number) => {
                        const message = typeof commit.commit?.message === 'string'
                            ? commit.commit.message
                            : 'No message'
                        const truncatedMessage = message.length > 25 ? `${message.substring(0, 25)}...` : message

                        return (
                            <div key={index} className="commit-item text-xs text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-1">
                                    <div
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: event.color }}
                                    />
                                    <span className="truncate">{truncatedMessage}</span>
                                </div>
                            </div>
                        )
                    })}
                    {commitCount > maxDisplayCommits && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            +{commitCount - maxDisplayCommits} more
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Custom day renderer for hover popup
    const renderDay = (date: Date, events: CalendarEvent[], isCurrentMonth: boolean, isToday: boolean) => {
        const dayCommits: Commit[] = []
        const commitsByRepo: Record<string, Commit[]> = {}

        events.forEach(event => {
            if (event.data?.commits) {
                const repoName = event.data.repoName || 'Unknown'
                dayCommits.push(...event.data.commits)

                if (!commitsByRepo[repoName]) {
                    commitsByRepo[repoName] = []
                }
                commitsByRepo[repoName].push(...event.data.commits)
            }
        })

        const repoCount = Object.keys(commitsByRepo).length
        const isHovered = hoveredDate && format(hoveredDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')

        const handleDayClick = () => {
            setSelectedDate(date)
            onDateClick?.(date)
        }

        const handleMouseEnter = () => {
            // Show popup immediately if there are commits
            if (dayCommits.length > 0) {
                setHoveredDate(date)
            }
        }

        const handleMouseLeave = () => {
            // Add a small delay to allow moving to popup
            setTimeout(() => {
                // Only hide if we're not hovering over the popup
                if (hoveredDate && format(hoveredDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')) {
                    // Check if we're still over this day or its popup
                    const isStillHovering = document.querySelector('.popup-container:hover')
                    if (!isStillHovering) {
                        setHoveredDate(null)
                    }
                }
            }, 100)
        }

        const handlePopupMouseEnter = () => {
            // Keep popup open when hovering over it
            setHoveredDate(date)
        }

        const handlePopupMouseLeave = () => {
            // Hide popup when leaving popup area
            setHoveredDate(null)
        }

        const handlePopupClick = () => {
            // Allow clicking on popup to open commit details
            handleDayClick()
        }

        return (
            <div
                className={`relative border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[120px] p-2 cursor-pointer transition-colors ${isCurrentMonth
                    ? "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    } ${isToday ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : ""} ${isHovered ? "z-[9999] relative" : ""}`}
                onClick={handleDayClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Day number */}
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isToday ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs" : ""
                        } ${!isCurrentMonth ? "text-gray-400 dark:text-gray-600" : ""}`}>
                        {format(date, 'd')}
                    </span>
                    {/* Repository count indicator */}
                    {repoCount > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {repoCount} repo{repoCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* Events */}
                <div className="space-y-1">
                    {events.slice(0, 3).map((event) => renderEvent(event, date))}
                </div>

                {/* Blur Focus Effect - blur everything except hovered day and popup */}
                {isHovered && dayCommits.length > 0 && (
                    <>
                        {/* Blur Backdrop */}
                        <div className="fixed inset-0 z-[9998] pointer-events-none">
                            <div className="absolute inset-0 backdrop-blur-sm bg-black/10" />
                        </div>

                        {/* Popup */}
                        <div
                            className="absolute top-0 left-full ml-2 z-[9999] max-h-96 popup-container"
                            style={{
                                // Smart positioning: if near right edge, show on left instead
                                left: typeof window !== 'undefined' && window.innerWidth - 640 < 0 ? 'auto' : '100%',
                                right: typeof window !== 'undefined' && window.innerWidth - 640 < 0 ? '100%' : 'auto',
                                marginLeft: typeof window !== 'undefined' && window.innerWidth - 640 < 0 ? 0 : '8px',
                                marginRight: typeof window !== 'undefined' && window.innerWidth - 640 < 0 ? '8px' : 0,
                                width: '40rem', // 640px - twice the original width (320px * 2)
                            }}
                            onMouseEnter={handlePopupMouseEnter}
                            onMouseLeave={handlePopupMouseLeave}
                            onClick={handlePopupClick}
                        >
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden cursor-pointer hover:shadow-3xl transition-shadow">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                                        {format(date, 'EEEE, MMMM d, yyyy')}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {dayCommits.length} commit{dayCommits.length !== 1 ? 's' : ''} across {repoCount} repositor{repoCount !== 1 ? 'ies' : 'y'} • Click for full details
                                    </p>
                                </div>

                                {/* Content organized by repository */}
                                <div className="p-4 max-h-64 overflow-y-auto">
                                    <div className="space-y-4">
                                        {Object.entries(commitsByRepo).map(([repoName, repoCommits], repoIndex) => (
                                            <div key={repoIndex} className="space-y-2">
                                                {/* Repository header */}
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">
                                                    <span>📁</span>
                                                    <span className="truncate">{repoName}</span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                        {repoCommits.length}
                                                    </span>
                                                </div>

                                                {/* Repository commits */}
                                                <div className="space-y-2 ml-4">
                                                    {repoCommits.slice(0, 3).map((commit, index) => {
                                                        const message = typeof commit.commit?.message === 'string' ? commit.commit.message : 'No message'
                                                        const author = commit.commit?.author?.name || 'Unknown'
                                                        const time = commit.commit?.author?.date ? format(new Date(commit.commit.author.date), 'HH:mm') : ''

                                                        return (
                                                            <div key={index} className="flex gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                                                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-blue-500" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 leading-relaxed">
                                                                        {message.length > 80 ? `${message.substring(0, 80)}...` : message}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {author} • {time}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                    {repoCommits.length > 3 && (
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                            +{repoCommits.length - 3} more commits in {repoName}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        )
    }

    return (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-visible">
            <CardContent className="p-0 overflow-visible">
                <Calendar
                    events={events}
                    initialView={initialView || 'month'}
                    initialDate={initialDate}
                    onNavigate={onCalendarNavigate}
                    onDateClick={(date) => {
                        setSelectedDate(date)
                        onDateClick?.(date)
                    }}
                    onEventClick={(event) => {
                        if (event.data?.commits?.[0]) {
                            onCommitClick?.(event.data.commits[0])
                        }
                    }}
                    renderDay={renderDay}
                    className={className}
                    showNavigation={true}
                    showViewSwitcher={true}
                />
            </CardContent>
        </Card>
    )
} 