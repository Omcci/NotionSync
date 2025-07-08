# Headless Calendar System

A fully customizable, shadcn-style calendar system that gives you complete control over styling and functionality.

## 🎯 **Why This Is Better Than FullCalendar**

✅ **Zero CSS Fighting** - No more `!important` overrides  
✅ **100% Customizable** - Style everything exactly how you want  
✅ **Native React** - Proper React patterns, not a wrapper  
✅ **TypeScript First** - Full type safety  
✅ **shadcn Compatible** - Works perfectly with your design system  
✅ **Performance** - Optimized React components

## 🏗️ **Architecture**

```
📦 Headless Calendar System
├── 🧠 useCalendar (headless logic)
├── 🎨 Calendar (main component)
├── 📅 CalendarGrid (view renderer)
├── 📋 CalendarDay (day component)
├── 🎯 CalendarEvent (event component)
└── 📝 CalendarHeader (navigation)
```

## 🚀 **Quick Start**

### Basic Usage

```tsx
import { Calendar } from '@/components/calendar'

const events = [
  {
    id: '1',
    title: 'Meeting',
    start: new Date(),
    end: new Date(),
    allDay: true,
    color: '#3b82f6'
  }
]

<Calendar
  events={events}
  onDateClick={(date) => console.log('Date clicked:', date)}
  onEventClick={(event) => console.log('Event clicked:', event)}
/>
```

### Advanced Customization

```tsx
<Calendar
  events={events}
  initialView="month"
  // Custom event rendering
  renderEvent={(event, date) => (
    <div className="p-2 bg-blue-100 rounded border-l-4 border-blue-500">
      <span className="font-medium">{event.title}</span>
    </div>
  )}
  // Custom day rendering
  renderDay={(date, events, isCurrentMonth, isToday) => (
    <div className={`p-2 ${isToday ? 'bg-blue-50' : ''}`}>
      <span className="text-sm">{format(date, 'd')}</span>
      {events.map((event) => (
        <div key={event.id} className="mt-1 text-xs">
          {event.title}
        </div>
      ))}
    </div>
  )}
  // Custom header
  renderHeader={(title) => (
    <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  )}
/>
```

## 🔄 **Migration from FullCalendar**

### Before (FullCalendar - 200+ lines of CSS)

```tsx
// Complex CSS overrides needed
const CalendarPage = () => {
  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        events={events}
        eventContent={(arg) => ({
          html: `<div class="custom-event">...</div>`, // Hard to customize
        })}
      />

      {/* 200+ lines of CSS to override FullCalendar styles */}
      <style jsx global>{`
        .fc-event {
          /* Complex overrides */
        }
        .fc-daygrid-day {
          /* More overrides */
        }
        /* ... 200 more lines ... */
      `}</style>
    </>
  )
}
```

### After (Headless Calendar - Clean & Simple)

```tsx
import { CommitCalendar } from '@/components/calendar/CommitCalendar'

const CalendarPage = () => {
  return (
    <CommitCalendar
      commits={commits}
      selectedRepo={selectedRepo}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      onDateClick={handleDateClick}
      onCommitClick={handleCommitClick}
    />
  )
  // Zero additional CSS needed!
}
```

## 🎨 **Styling Examples**

### Custom Event Colors

```tsx
const eventClassName = (event: CalendarEvent) => {
  switch (event.data?.type) {
    case 'meeting':
      return 'bg-blue-100 border-blue-500 text-blue-700'
    case 'deadline':
      return 'bg-red-100 border-red-500 text-red-700'
    case 'holiday':
      return 'bg-green-100 border-green-500 text-green-700'
    default:
      return 'bg-gray-100 border-gray-500 text-gray-700'
  }
}

;<Calendar eventClassName={eventClassName} />
```

### Custom Day Styling

```tsx
const dayClassName = (
  date: Date,
  isCurrentMonth: boolean,
  isToday: boolean,
) => {
  if (isToday) return 'bg-blue-50 border-blue-200'
  if (!isCurrentMonth) return 'bg-gray-50 text-gray-400'
  return 'hover:bg-gray-50'
}

;<Calendar dayClassName={dayClassName} />
```

## 🔧 **Commit Calendar Example**

The `CommitCalendar` component shows how to recreate your exact existing functionality:

```tsx
<CommitCalendar
  commits={commits}
  selectedRepo={selectedRepo}
  isLoading={isLoading}
  onRefresh={handleRefresh}
  onDateClick={handleDateClick}
  onCommitClick={handleCommitClick}
/>
```

### Features Preserved:

- ✅ Commit grouping by date/repo
- ✅ Color coding by commit type
- ✅ Hover popups with commit details
- ✅ "+X more" indicators
- ✅ Repository filtering
- ✅ Month/Week/Day views
- ✅ Dark mode support
- ✅ Responsive design
- ✅ All your existing interactions

## 📱 **Views**

### Month View

```tsx
<Calendar initialView="month" />
```

### Week View

```tsx
<Calendar initialView="week" />
```

### Day View

```tsx
<Calendar initialView="day" />
```

## 🎛️ **API Reference**

### Calendar Props

| Prop             | Type                               | Description                |
| ---------------- | ---------------------------------- | -------------------------- |
| `events`         | `CalendarEvent[]`                  | Array of events to display |
| `initialView`    | `'month' \| 'week' \| 'day'`       | Starting view              |
| `onDateClick`    | `(date: Date) => void`             | Date click handler         |
| `onEventClick`   | `(event: CalendarEvent) => void`   | Event click handler        |
| `renderEvent`    | `(event, date) => ReactNode`       | Custom event renderer      |
| `renderDay`      | `(date, events, ...) => ReactNode` | Custom day renderer        |
| `renderHeader`   | `(title, subtitle) => ReactNode`   | Custom header renderer     |
| `eventClassName` | `string \| function`               | Event styling              |
| `dayClassName`   | `string \| function`               | Day styling                |

### useCalendar Hook

```tsx
const calendar = useCalendar({
  events,
  initialView: 'month',
  initialDate: new Date(),
})

// Available methods:
calendar.goToNext()
calendar.goToPrevious()
calendar.goToToday()
calendar.setView('week')
calendar.weeks // Month view data
calendar.days // Week/Day view data
```

## 🚀 **Benefits**

1. **Complete Control**: Style everything exactly how you want
2. **No CSS Wrestling**: Zero `!important` overrides needed
3. **Type Safety**: Full TypeScript support
4. **Performance**: Optimized React rendering
5. **Maintainable**: Clean, modular code
6. **Extensible**: Easy to add new features
7. **shadcn Compatible**: Works with your design system

## 🔄 **Easy Migration**

Replace your existing calendar in 3 steps:

1. **Install**: Already available in your components
2. **Replace**: Switch FullCalendar with CommitCalendar
3. **Customize**: Tweak the styling as needed

**Result**: Same functionality, 90% less CSS, 100% more control! 🎉
