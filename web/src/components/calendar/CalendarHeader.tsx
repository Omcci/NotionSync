import React from 'react'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { CalendarView } from '@/hooks/useCalendar'
import { cn } from '@/lib/utils'

export interface CalendarHeaderProps {
  title: string
  subtitle: string
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onNext: () => void
  onPrevious: () => void
  onToday: () => void
  showNavigation?: boolean
  showViewSwitcher?: boolean
  renderHeader?: (title: string, subtitle: string) => React.ReactNode
  className?: string
}

export function CalendarHeader({
  title,
  subtitle,
  view,
  onViewChange,
  onNext,
  onPrevious,
  onToday,
  showNavigation = true,
  showViewSwitcher = true,
  renderHeader,
  className,
}: CalendarHeaderProps) {
  if (renderHeader) {
    return (
      <div className={cn('calendar-header', className)}>
        {renderHeader(title, subtitle)}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'calendar-header flex items-center justify-between p-6 bg-slate-800 text-white border-b-2 border-slate-600 rounded-t-lg',
        className,
      )}
    >
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        {showNavigation && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              className="text-white hover:bg-white/10 h-8 w-8 p-0 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              className="text-white hover:bg-white/10 h-8 w-8 p-0 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToday}
              className="text-white hover:bg-white/10 px-3 h-8 transition-colors"
            >
              Today
            </Button>
          </>
        )}
      </div>

      {/* Center: Title */}
      <div className="flex flex-col items-center">
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm opacity-75">{subtitle}</p>}
      </div>

      {/* Right: View Switcher */}
      <div className="flex items-center gap-1">
        {showViewSwitcher && (
          <>
            <Button
              variant={view === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('month')}
              className={cn(
                'h-8 px-3 transition-colors',
                view === 'month'
                  ? 'bg-white/15 text-white hover:bg-white/20'
                  : 'text-white hover:bg-white/10',
              )}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('week')}
              className={cn(
                'h-8 px-3 transition-colors',
                view === 'week'
                  ? 'bg-white/15 text-white hover:bg-white/20'
                  : 'text-white hover:bg-white/10',
              )}
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('day')}
              className={cn(
                'h-8 px-3 transition-colors',
                view === 'day'
                  ? 'bg-white/15 text-white hover:bg-white/20'
                  : 'text-white hover:bg-white/10',
              )}
            >
              Day
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
