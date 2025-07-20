export { Calendar } from './Calendar'
export { CalendarHeader } from './CalendarHeader'
export { CalendarGrid } from './CalendarGrid'
export { CalendarDay } from './CalendarDay'
export { CalendarEventComponent } from './CalendarEvent'

export type { CalendarProps } from './Calendar'
export type { CalendarHeaderProps } from './CalendarHeader'
export type { CalendarGridProps } from './CalendarGrid'
export type { CalendarDayProps } from './CalendarDay'
export type { CalendarEventProps } from './CalendarEvent'

// Re-export hook types
export type {
  CalendarEvent,
  CalendarView,
  CalendarDay as CalendarDayData,
  UseCalendarOptions,
  UseCalendarReturn,
} from '@/hooks/useCalendar'
export { useCalendar } from '@/hooks/useCalendar'
