import { renderHook, act } from '@testing-library/react'
import { useCalendar, CalendarEvent } from '@/hooks/useCalendar'
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns'

describe('useCalendar', () => {
  const fixedDate = new Date('2024-06-15T12:00:00Z')

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(fixedDate)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useCalendar())

      expect(result.current.view).toBe('month')
      expect(format(result.current.currentDate, 'yyyy-MM-dd')).toBe(
        '2024-06-15'
      )
    })

    it('initializes with custom date', () => {
      const customDate = new Date('2024-01-01')
      const { result } = renderHook(() =>
        useCalendar({ initialDate: customDate })
      )

      expect(format(result.current.currentDate, 'yyyy-MM-dd')).toBe(
        '2024-01-01'
      )
    })

    it('initializes with custom view', () => {
      const { result } = renderHook(() => useCalendar({ initialView: 'week' }))

      expect(result.current.view).toBe('week')
    })

    it('initializes with events', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Test Event',
          start: new Date('2024-06-15T10:00:00'),
          end: new Date('2024-06-15T11:00:00'),
        },
      ]

      const { result } = renderHook(() => useCalendar({ events }))

      const dayWithEvent = result.current.days.find(
        d => format(d.date, 'yyyy-MM-dd') === '2024-06-15'
      )
      expect(dayWithEvent?.events).toHaveLength(1)
    })

    it('initializes with custom weekStartsOn', () => {
      const { result } = renderHook(
        () => useCalendar({ weekStartsOn: 1 }) // Monday
      )

      // First day of week should be Monday
      expect(result.current.weekDays[0].short).toBe('Mon')
    })
  })

  describe('navigation', () => {
    it('navigates to next month in month view', () => {
      const { result } = renderHook(() => useCalendar())

      act(() => {
        result.current.goToNext()
      })

      expect(format(result.current.currentDate, 'yyyy-MM')).toBe('2024-07')
    })

    it('navigates to previous month in month view', () => {
      const { result } = renderHook(() => useCalendar())

      act(() => {
        result.current.goToPrevious()
      })

      expect(format(result.current.currentDate, 'yyyy-MM')).toBe('2024-05')
    })

    it('navigates to next week in week view', () => {
      const { result } = renderHook(() => useCalendar({ initialView: 'week' }))

      const initialDate = result.current.currentDate

      act(() => {
        result.current.goToNext()
      })

      const expectedDate = addWeeks(initialDate, 1)
      expect(format(result.current.currentDate, 'yyyy-MM-dd')).toBe(
        format(expectedDate, 'yyyy-MM-dd')
      )
    })

    it('navigates to previous week in week view', () => {
      const { result } = renderHook(() => useCalendar({ initialView: 'week' }))

      const initialDate = result.current.currentDate

      act(() => {
        result.current.goToPrevious()
      })

      const expectedDate = subWeeks(initialDate, 1)
      expect(format(result.current.currentDate, 'yyyy-MM-dd')).toBe(
        format(expectedDate, 'yyyy-MM-dd')
      )
    })

    it('navigates to next day in day view', () => {
      const { result } = renderHook(() => useCalendar({ initialView: 'day' }))

      act(() => {
        result.current.goToNext()
      })

      expect(format(result.current.currentDate, 'yyyy-MM-dd')).toBe(
        '2024-06-16'
      )
    })

    it('navigates to previous day in day view', () => {
      const { result } = renderHook(() => useCalendar({ initialView: 'day' }))

      act(() => {
        result.current.goToPrevious()
      })

      expect(format(result.current.currentDate, 'yyyy-MM-dd')).toBe(
        '2024-06-14'
      )
    })

    it('goes to today', () => {
      const pastDate = new Date('2023-01-01')
      const { result } = renderHook(() =>
        useCalendar({ initialDate: pastDate })
      )

      act(() => {
        result.current.goToToday()
      })

      expect(format(result.current.currentDate, 'yyyy-MM-dd')).toBe(
        '2024-06-15'
      )
    })

    it('goes to specific date', () => {
      const { result } = renderHook(() => useCalendar())

      act(() => {
        result.current.goToDate(new Date('2025-12-25'))
      })

      expect(format(result.current.currentDate, 'yyyy-MM-dd')).toBe(
        '2025-12-25'
      )
    })
  })

  describe('view changes', () => {
    it('changes view correctly', () => {
      const { result } = renderHook(() => useCalendar())

      expect(result.current.view).toBe('month')

      act(() => {
        result.current.setView('week')
      })
      expect(result.current.view).toBe('week')

      act(() => {
        result.current.setView('day')
      })
      expect(result.current.view).toBe('day')
    })

    it('provides correct view helper flags', () => {
      const { result } = renderHook(() => useCalendar())

      expect(result.current.isMonthView).toBe(true)
      expect(result.current.isWeekView).toBe(false)
      expect(result.current.isDayView).toBe(false)

      act(() => {
        result.current.setView('week')
      })

      expect(result.current.isMonthView).toBe(false)
      expect(result.current.isWeekView).toBe(true)
      expect(result.current.isDayView).toBe(false)
    })
  })

  describe('date range', () => {
    it('calculates correct date range for month view', () => {
      const { result } = renderHook(() =>
        useCalendar({ initialDate: new Date('2024-06-15') })
      )

      // June 2024 starts on Saturday, ends on Sunday
      // Calendar should show from May 26 (Sunday before) to July 6 (Saturday after)
      // With weekStartsOn: 0 (Sunday)
      const startDate = result.current.dateRange.start
      const endDate = result.current.dateRange.end

      // Start should be in May (month index 4, 0-based) or June (month index 5)
      // End should be in June (month index 5) or July (month index 6)
      expect(startDate.getMonth()).toBeLessThanOrEqual(5) // May or June
      expect(endDate.getMonth()).toBeGreaterThanOrEqual(5) // June or July

      // If start is in May, it should be May 26
      if (startDate.getMonth() === 4) {
        expect(startDate.getDate()).toBe(26)
      }
    })

    it('calculates correct date range for week view', () => {
      const { result } = renderHook(() =>
        useCalendar({
          initialDate: new Date('2024-06-15'),
          initialView: 'week',
        })
      )

      // Should be 7 days
      const days = result.current.days
      expect(days).toHaveLength(7)
    })

    it('calculates correct date range for day view', () => {
      const { result } = renderHook(() =>
        useCalendar({ initialDate: new Date('2024-06-15'), initialView: 'day' })
      )

      // Should be 1 day
      expect(result.current.days).toHaveLength(1)
      expect(format(result.current.days[0].date, 'yyyy-MM-dd')).toBe(
        '2024-06-15'
      )
    })
  })

  describe('days computation', () => {
    it('marks current month days correctly in month view', () => {
      const { result } = renderHook(() =>
        useCalendar({ initialDate: new Date('2024-06-15') })
      )

      const juneDays = result.current.days.filter(d => d.isCurrentMonth)
      expect(juneDays.length).toBe(30) // June has 30 days
    })

    it('marks today correctly', () => {
      const { result } = renderHook(() => useCalendar())

      const todayDay = result.current.days.find(d => d.isToday)
      expect(todayDay).toBeDefined()
      expect(format(todayDay!.date, 'yyyy-MM-dd')).toBe('2024-06-15')
    })

    it('computes weeks correctly in month view', () => {
      const { result } = renderHook(() => useCalendar())

      // A month view should have 5-6 weeks
      expect(result.current.weeks.length).toBeGreaterThanOrEqual(5)
      expect(result.current.weeks.length).toBeLessThanOrEqual(6)

      // Each week should have 7 days
      result.current.weeks.forEach(week => {
        expect(week).toHaveLength(7)
      })
    })

    it('returns empty weeks array for non-month views', () => {
      const { result } = renderHook(() => useCalendar({ initialView: 'week' }))

      expect(result.current.weeks).toHaveLength(0)
    })
  })

  describe('events', () => {
    it('indexes events by date for O(1) lookup', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Event 1',
          start: new Date('2024-06-15T10:00:00'),
          end: new Date('2024-06-15T11:00:00'),
        },
        {
          id: '2',
          title: 'Event 2',
          start: new Date('2024-06-15T14:00:00'),
          end: new Date('2024-06-15T15:00:00'),
        },
        {
          id: '3',
          title: 'Event 3',
          start: new Date('2024-06-20T10:00:00'),
          end: new Date('2024-06-20T11:00:00'),
        },
      ]

      const { result } = renderHook(() => useCalendar({ events }))

      const day15 = result.current.days.find(
        d => format(d.date, 'yyyy-MM-dd') === '2024-06-15'
      )
      const day20 = result.current.days.find(
        d => format(d.date, 'yyyy-MM-dd') === '2024-06-20'
      )
      const day16 = result.current.days.find(
        d => format(d.date, 'yyyy-MM-dd') === '2024-06-16'
      )

      expect(day15?.events).toHaveLength(2)
      expect(day20?.events).toHaveLength(1)
      expect(day16?.events).toHaveLength(0)
    })

    it('handles all-day events correctly', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'All Day Event',
          start: new Date('2024-06-15'),
          end: new Date('2024-06-15'),
          allDay: true,
        },
      ]

      const { result } = renderHook(() => useCalendar({ events }))

      const eventsForDate = result.current.getEventsForDate(
        new Date('2024-06-15')
      )
      expect(eventsForDate).toHaveLength(1)
      expect(eventsForDate[0].title).toBe('All Day Event')
    })

    it('handles multi-day events', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Multi-day Event',
          start: new Date('2024-06-14T00:00:00'),
          end: new Date('2024-06-16T23:59:59'),
        },
      ]

      const { result } = renderHook(() => useCalendar({ events }))

      // Event should appear on all three days
      const day14Events = result.current.getEventsForDate(
        new Date('2024-06-14')
      )
      const day15Events = result.current.getEventsForDate(
        new Date('2024-06-15')
      )
      const day16Events = result.current.getEventsForDate(
        new Date('2024-06-16')
      )

      expect(day14Events).toHaveLength(1)
      expect(day15Events).toHaveLength(1)
      expect(day16Events).toHaveLength(1)
    })

    it('getEventsForDate returns empty array for dates without events', () => {
      const { result } = renderHook(() => useCalendar({ events: [] }))

      const events = result.current.getEventsForDate(new Date('2024-06-15'))
      expect(events).toEqual([])
    })
  })

  describe('header', () => {
    it('returns correct header for month view', () => {
      const { result } = renderHook(() =>
        useCalendar({ initialDate: new Date('2024-06-15') })
      )

      expect(result.current.header.title).toBe('June 2024')
    })

    it('returns correct header for week view', () => {
      const { result } = renderHook(() =>
        useCalendar({
          initialDate: new Date('2024-06-15'),
          initialView: 'week',
        })
      )

      // Week of June 15 should show date range
      expect(result.current.header.title).toContain('Jun')
    })

    it('returns correct header for day view', () => {
      const { result } = renderHook(() =>
        useCalendar({ initialDate: new Date('2024-06-15'), initialView: 'day' })
      )

      expect(result.current.header.title).toContain('Saturday')
      expect(result.current.header.title).toContain('June 15')
    })
  })

  describe('weekDays', () => {
    it('returns correct week day headers starting from Sunday', () => {
      const { result } = renderHook(() => useCalendar({ weekStartsOn: 0 }))

      expect(result.current.weekDays[0].short).toBe('Sun')
      expect(result.current.weekDays[6].short).toBe('Sat')
    })

    it('returns correct week day headers starting from Monday', () => {
      const { result } = renderHook(() => useCalendar({ weekStartsOn: 1 }))

      expect(result.current.weekDays[0].short).toBe('Mon')
      expect(result.current.weekDays[6].short).toBe('Sun')
    })
  })
})
