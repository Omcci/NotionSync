import React from 'react'
import { cn } from '@/lib/utils'
import { CalendarEvent, UseCalendarReturn } from '@/hooks/useCalendar'
import { CalendarDay } from './CalendarDay'
import { format } from 'date-fns'

export interface CalendarGridProps {
  calendar: UseCalendarReturn
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
  className?: string
}

export function CalendarGrid({
  calendar,
  onDateClick,
  onEventClick,
  onDateHover,
  onEventHover,
  renderEvent,
  renderDay,
  eventClassName,
  dayClassName,
  maxEventsPerDay = 3,
  className,
}: CalendarGridProps) {
  if (calendar.isMonthView) {
    return (
      <div
        className={cn(
          'calendar-grid h-full flex flex-col bg-gray-50 dark:bg-gray-900',
          className,
        )}
      >
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
          {calendar.weekDays.map((day) => (
            <div
              key={day.short}
              className="p-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              {day.short}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="flex-1 grid grid-rows-6">
          {calendar.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.map((day) => (
                <CalendarDay
                  key={day.date.toISOString()}
                  date={day.date}
                  events={day.events}
                  isCurrentMonth={day.isCurrentMonth}
                  isToday={day.isToday}
                  onDateClick={onDateClick}
                  onEventClick={onEventClick}
                  onDateHover={onDateHover}
                  onEventHover={onEventHover}
                  renderEvent={renderEvent}
                  renderDay={renderDay}
                  eventClassName={eventClassName}
                  dayClassName={dayClassName}
                  maxEventsPerDay={maxEventsPerDay}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (calendar.isWeekView) {
    return (
      <div className={cn('calendar-grid h-full flex flex-col', className)}>
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {calendar.weekDays.map((dayHeader) => {
            const dayData = calendar.days.find(
              (day) => format(day.date, 'EEE') === dayHeader.short,
            )
            return (
              <div
                key={dayHeader.short}
                className="p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0"
              >
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {dayHeader.short}
                </div>
                {dayData && (
                  <div
                    className={cn(
                      'text-lg font-semibold mt-1',
                      dayData.isToday
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-gray-100',
                    )}
                  >
                    {format(dayData.date, 'd')}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Week days */}
        <div className="flex-1 grid grid-cols-7">
          {calendar.days.map((day) => (
            <CalendarDay
              key={day.date.toISOString()}
              date={day.date}
              events={day.events}
              isCurrentMonth={day.isCurrentMonth}
              isToday={day.isToday}
              onDateClick={onDateClick}
              onEventClick={onEventClick}
              onDateHover={onDateHover}
              onEventHover={onEventHover}
              renderEvent={renderEvent}
              renderDay={renderDay}
              eventClassName={eventClassName}
              dayClassName={dayClassName}
              maxEventsPerDay={maxEventsPerDay}
              showDayNumber={false} // Don't show day number in week view header
            />
          ))}
        </div>
      </div>
    )
  }

  if (calendar.isDayView) {
    const day = calendar.days[0] // Single day
    if (!day) return null

    return (
      <div className={cn('calendar-grid h-full', className)}>
        <CalendarDay
          date={day.date}
          events={day.events}
          isCurrentMonth={day.isCurrentMonth}
          isToday={day.isToday}
          onDateClick={onDateClick}
          onEventClick={onEventClick}
          onDateHover={onDateHover}
          onEventHover={onEventHover}
          renderEvent={renderEvent}
          renderDay={renderDay}
          eventClassName={eventClassName}
          dayClassName={dayClassName}
          maxEventsPerDay={100} // Show all events in day view
          showDayNumber={false}
          className="h-full"
        />
      </div>
    )
  }

  return null
}
