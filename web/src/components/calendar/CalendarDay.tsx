import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { CalendarEvent } from '@/hooks/useCalendar'
import { format } from 'date-fns'
import { CalendarEventComponent } from './CalendarEvent'

export interface CalendarDayProps {
  date: Date
  events: CalendarEvent[]
  isCurrentMonth: boolean
  isToday: boolean
  onDateClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onDateHover?: (date: Date) => void
  onEventHover?: (event: CalendarEvent) => void
  renderEvent?: (event: CalendarEvent, date: Date) => React.ReactNode
  renderDay?: (
    date: Date,
    events: CalendarEvent[],
    isCurrentMonth: boolean,
    isToday: boolean,
  ) => React.ReactNode
  eventClassName?: string | ((event: CalendarEvent) => string)
  dayClassName?:
    | string
    | ((date: Date, isCurrentMonth: boolean, isToday: boolean) => string)
  maxEventsPerDay?: number
  showDayNumber?: boolean
  className?: string
}

export function CalendarDay({
  date,
  events,
  isCurrentMonth,
  isToday,
  onDateClick,
  onEventClick,
  onDateHover,
  onEventHover,
  renderEvent,
  renderDay,
  eventClassName,
  dayClassName,
  maxEventsPerDay = 3,
  showDayNumber = true,
  className,
}: CalendarDayProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Use custom render function if provided
  if (renderDay) {
    return (
      <div className={cn('calendar-day', className)}>
        {renderDay(date, events, isCurrentMonth, isToday)}
      </div>
    )
  }

  const handleDateClick = () => {
    onDateClick?.(date)
  }

  const handleDateHover = () => {
    onDateHover?.(date)
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    onEventClick?.(event)
  }

  const handleEventHover = (event: CalendarEvent) => {
    onEventHover?.(event)
  }

  // Calculate day className
  const computedDayClassName =
    typeof dayClassName === 'function'
      ? dayClassName(date, isCurrentMonth, isToday)
      : dayClassName

  const visibleEvents = events.slice(0, maxEventsPerDay)
  const hiddenEventsCount = Math.max(0, events.length - maxEventsPerDay)

  return (
    <div
      className={cn(
        'calendar-day relative border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-h-[120px] p-2 cursor-pointer transition-colors',
        isCurrentMonth
          ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
          : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
        isToday &&
          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        isHovered && 'bg-gray-100 dark:bg-gray-700',
        computedDayClassName,
        className,
      )}
      onClick={handleDateClick}
      onMouseEnter={() => {
        setIsHovered(true)
        handleDateHover()
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Day number */}
      {showDayNumber && (
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              'text-sm font-medium',
              isToday &&
                'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs',
              !isCurrentMonth && 'text-gray-400 dark:text-gray-600',
            )}
          >
            {format(date, 'd')}
          </span>
        </div>
      )}

      {/* Events */}
      <div className="space-y-1">
        {visibleEvents.map((event) => (
          <CalendarEventComponent
            key={event.id}
            event={event}
            date={date}
            onClick={(e) => handleEventClick(event, e)}
            onHover={() => handleEventHover(event)}
            renderEvent={renderEvent}
            eventClassName={eventClassName}
          />
        ))}

        {/* Show more indicator */}
        {hiddenEventsCount > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            +{hiddenEventsCount} more
          </div>
        )}
      </div>

      {/* Today indicator (alternative style) */}
      {isToday && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
      )}
    </div>
  )
}
