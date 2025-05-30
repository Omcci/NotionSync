import React from 'react'
import { cn } from '@/lib/utils'
import { CalendarEvent } from '@/hooks/useCalendar'
import { format } from 'date-fns'

export interface CalendarEventProps {
    event: CalendarEvent
    date: Date
    onClick?: (e: React.MouseEvent) => void
    onHover?: () => void
    renderEvent?: (event: CalendarEvent, date: Date) => React.ReactNode
    eventClassName?: string | ((event: CalendarEvent) => string)
    className?: string
}

export function CalendarEventComponent({
    event,
    date,
    onClick,
    onHover,
    renderEvent,
    eventClassName,
    className
}: CalendarEventProps) {
    // Use custom render function if provided
    if (renderEvent) {
        return (
            <div
                className={cn("calendar-event cursor-pointer", className)}
                onClick={onClick}
                onMouseEnter={onHover}
            >
                {renderEvent(event, date)}
            </div>
        )
    }

    // Calculate event className
    const computedEventClassName = typeof eventClassName === 'function'
        ? eventClassName(event)
        : eventClassName

    // Default event colors based on type/category
    const getEventColor = (event: CalendarEvent) => {
        if (event.color) return event.color

        // Default color scheme
        const title = event.title.toLowerCase()
        if (title.includes('bug') || title.includes('fix')) return '#ef4444' // red
        if (title.includes('feature') || title.includes('feat')) return '#10b981' // emerald
        if (title.includes('docs')) return '#f59e0b' // amber
        if (title.includes('refactor')) return '#8b5cf6' // violet
        if (title.includes('test')) return '#06b6d4' // cyan
        if (title.includes('style') || title.includes('ui')) return '#ec4899' // pink

        return '#6366f1' // default indigo
    }

    const eventColor = getEventColor(event)

    return (
        <div
            className={cn(
                "calendar-event px-2 py-1 rounded text-xs font-medium cursor-pointer transition-all hover:shadow-sm",
                "border-l-2 bg-opacity-10 hover:bg-opacity-20",
                computedEventClassName,
                className
            )}
            style={{
                borderLeftColor: eventColor,
                backgroundColor: `${eventColor}20`,
                color: eventColor
            }}
            onClick={onClick}
            onMouseEnter={onHover}
            title={event.title}
        >
            <div className="flex items-center gap-1">
                {/* Event time (if not all-day) */}
                {!event.allDay && (
                    <span className="text-xs opacity-75">
                        {format(event.start, 'HH:mm')}
                    </span>
                )}

                {/* Event title */}
                <span className="truncate flex-1">
                    {event.title}
                </span>
            </div>
        </div>
    )
} 