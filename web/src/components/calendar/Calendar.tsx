import React, { forwardRef, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  CalendarEvent,
  CalendarView,
  useCalendar,
  UseCalendarOptions,
} from '@/hooks/useCalendar'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarGrid } from './CalendarGrid'
import { CalendarHeader } from './CalendarHeader'

export interface CalendarProps extends UseCalendarOptions {
  className?: string

  // Event handlers
  onDateClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onDateHover?: (date: Date) => void
  onEventHover?: (event: CalendarEvent) => void

  // Navigation callbacks
  onNavigate?: (date: Date) => void
  onViewChange?: (view: CalendarView) => void

  // Render props for full customization
  renderEvent?: (event: CalendarEvent, date: Date) => React.ReactNode
  renderDay?: (
    date: Date,
    events: CalendarEvent[],
    isCurrentMonth: boolean,
    isToday: boolean,
  ) => React.ReactNode
  renderHeader?: (title: string, subtitle: string) => React.ReactNode

  // Style customization
  eventClassName?: string | ((event: CalendarEvent) => string)
  dayClassName?:
    | string
    | ((date: Date, isCurrentMonth: boolean, isToday: boolean) => string)

  // Display options
  showNavigation?: boolean
  showViewSwitcher?: boolean
  maxEventsPerDay?: number
}

const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      className,
      onDateClick,
      onEventClick,
      onDateHover,
      onEventHover,
      onNavigate,
      onViewChange,
      renderEvent,
      renderDay,
      renderHeader,
      eventClassName,
      dayClassName,
      showNavigation = true,
      showViewSwitcher = true,
      maxEventsPerDay = 3,
      ...calendarOptions
    },
    ref,
  ) => {
    const calendar = useCalendar(calendarOptions)
    const lastNavigateDate = useRef<Date | null>(null)

    const handleDateClick = (date: Date) => {
      onDateClick?.(date)
    }

    const handleEventClick = (event: CalendarEvent) => {
      onEventClick?.(event)
    }

    const handleNavigate = (date: Date) => {
      // Prevent duplicate navigation calls for the same date
      if (
        lastNavigateDate.current &&
        lastNavigateDate.current.getTime() === date.getTime()
      ) {
        return
      }

      lastNavigateDate.current = date
      onNavigate?.(date)
    }

    const handleNext = () => {
      calendar.goToNext()
      handleNavigate(calendar.currentDate)
    }

    const handlePrevious = () => {
      calendar.goToPrevious()
      handleNavigate(calendar.currentDate)
    }

    const handleToday = () => {
      calendar.goToToday()
      handleNavigate(calendar.currentDate)
    }

    const handleViewChange = (view: CalendarView) => {
      calendar.setView(view)
      onViewChange?.(view)
    }

    return (
      <div
        ref={ref}
        className={cn('calendar w-full h-full flex flex-col', className)}
      >
        {/* Header */}
        <CalendarHeader
          title={calendar.header.title}
          subtitle={calendar.header.subtitle}
          view={calendar.view}
          onViewChange={handleViewChange}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onToday={handleToday}
          showNavigation={showNavigation}
          showViewSwitcher={showViewSwitcher}
          renderHeader={renderHeader}
        />

        {/* Calendar Grid */}
        <div className="calendar-body flex-1 min-h-0">
          <CalendarGrid
            calendar={calendar}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onDateHover={onDateHover}
            onEventHover={onEventHover}
            renderEvent={renderEvent}
            renderDay={renderDay}
            eventClassName={eventClassName}
            dayClassName={dayClassName}
            maxEventsPerDay={maxEventsPerDay}
          />
        </div>
      </div>
    )
  },
)

Calendar.displayName = 'Calendar'

export { Calendar }
