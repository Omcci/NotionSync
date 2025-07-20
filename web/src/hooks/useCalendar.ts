import { useState, useMemo, useCallback } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  format,
  isToday,
  startOfDay,
  endOfDay,
  isWithinInterval,
  addDays,
  subDays,
} from 'date-fns'

export type CalendarView = 'month' | 'week' | 'day'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  color?: string
  data?: any
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
}

export interface UseCalendarOptions {
  initialDate?: Date
  initialView?: CalendarView
  events?: CalendarEvent[]
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function useCalendar({
  initialDate = new Date(),
  initialView = 'month',
  events = [],
  weekStartsOn = 0,
}: UseCalendarOptions = {}) {
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [view, setView] = useState<CalendarView>(initialView)

  // Navigation functions
  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      switch (view) {
        case 'month':
          return addMonths(prev, 1)
        case 'week':
          return addWeeks(prev, 1)
        case 'day':
          return addDays(prev, 1)
        default:
          return prev
      }
    })
  }, [view])

  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => {
      switch (view) {
        case 'month':
          return subMonths(prev, 1)
        case 'week':
          return subWeeks(prev, 1)
        case 'day':
          return subDays(prev, 1)
        default:
          return prev
      }
    })
  }, [view])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  // Get date range for current view
  const dateRange = useMemo(() => {
    switch (view) {
      case 'month': {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        const calendarStart = startOfWeek(monthStart, { weekStartsOn })
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn })
        return { start: calendarStart, end: calendarEnd }
      }
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn })
        return { start: weekStart, end: weekEnd }
      }
      case 'day': {
        const dayStart = startOfDay(currentDate)
        const dayEnd = endOfDay(currentDate)
        return { start: dayStart, end: dayEnd }
      }
      default:
        return { start: new Date(), end: new Date() }
    }
  }, [currentDate, view, weekStartsOn])

  // Get all days for current view
  const days = useMemo(() => {
    const interval = { start: dateRange.start, end: dateRange.end }
    const allDays = eachDayOfInterval(interval)

    return allDays.map((date) => {
      const dayEvents = events.filter((event) => {
        if (event.allDay) {
          return isSameDay(event.start, date)
        }

        const dayStart = startOfDay(date)
        const dayEnd = endOfDay(date)

        return (
          isWithinInterval(event.start, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(event.end, { start: dayStart, end: dayEnd }) ||
          (event.start <= dayStart && event.end >= dayEnd)
        )
      })

      return {
        date,
        isCurrentMonth:
          view === 'month' ? isSameMonth(date, currentDate) : true,
        isToday: isToday(date),
        events: dayEvents,
      } as CalendarDay
    })
  }, [dateRange, events, currentDate, view])

  // Get weeks (for month view)
  const weeks = useMemo(() => {
    if (view !== 'month') return []

    const weeks: CalendarDay[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }
    return weeks
  }, [days, view])

  // Get header info
  const header = useMemo(() => {
    switch (view) {
      case 'month':
        return {
          title: format(currentDate, 'MMMM yyyy'),
          subtitle: format(currentDate, 'yyyy'),
        }
      case 'week':
        return {
          title: `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`,
          subtitle: format(currentDate, 'yyyy'),
        }
      case 'day':
        return {
          title: format(currentDate, 'EEEE, MMMM d, yyyy'),
          subtitle: format(currentDate, 'yyyy'),
        }
      default:
        return { title: '', subtitle: '' }
    }
  }, [currentDate, view, dateRange])

  // Get events for a specific date
  const getEventsForDate = useCallback(
    (date: Date) => {
      return events.filter((event) => {
        if (event.allDay) {
          return isSameDay(event.start, date)
        }

        const dayStart = startOfDay(date)
        const dayEnd = endOfDay(date)

        return (
          isWithinInterval(event.start, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(event.end, { start: dayStart, end: dayEnd }) ||
          (event.start <= dayStart && event.end >= dayEnd)
        )
      })
    },
    [events],
  )

  // Get week day headers
  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn })
    return eachDayOfInterval({ start, end: addDays(start, 6) }).map((date) => ({
      short: format(date, 'EEE'),
      long: format(date, 'EEEE'),
      date,
    }))
  }, [weekStartsOn])

  return {
    // State
    currentDate,
    view,
    dateRange,

    // Navigation
    goToNext,
    goToPrevious,
    goToToday,
    goToDate,
    setView,

    // Data
    days,
    weeks,
    weekDays,
    header,

    // Utilities
    getEventsForDate,

    // View helpers
    isMonthView: view === 'month',
    isWeekView: view === 'week',
    isDayView: view === 'day',
  }
}

export type UseCalendarReturn = ReturnType<typeof useCalendar>
