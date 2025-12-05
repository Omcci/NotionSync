# 🚀 Headless Calendar System - Usage Guide

## ✨ **What You Now Have**

A **completely customizable calendar system** built like shadcn components:

- 🧠 **Headless logic** (`useCalendar` hook)
- 🎨 **Fully customizable UI** (render props + className functions)
- 🏗️ **Modular architecture** (separate components for each part)

## 🔄 **Migration Example**

Replace your existing FullCalendar with this:

```tsx
import { CommitCalendar } from '@/components/calendar/CommitCalendar'

// Before: Complex FullCalendar + 200 lines of CSS
// After: Simple, clean component
;<CommitCalendar
  commits={commits}
  selectedRepo={selectedRepo}
  isLoading={isLoading}
  onRefresh={handleRefresh}
  onDateClick={handleDateClick}
  onCommitClick={handleCommitClick}
/>
```

## 🎯 **Key Benefits**

1. **Zero CSS Wrestling** - No more `!important` overrides
2. **100% Customizable** - Control every pixel
3. **Type Safe** - Full TypeScript support
4. **Performance** - Optimized React rendering
5. **Maintainable** - Clean, modular code

## 🛠️ **Components Created**

- `useCalendar` - Headless calendar logic
- `Calendar` - Main calendar component
- `CalendarHeader` - Navigation and view switcher
- `CalendarGrid` - Month/Week/Day views
- `CalendarDay` - Individual day cells
- `CalendarEvent` - Event rendering
- `CommitCalendar` - Your specialized commit calendar

## 🎨 **Customization Examples**

### Custom Event Colors

```tsx
<Calendar
  eventClassName={event => {
    if (event.title.includes('bug')) return 'bg-red-100 border-red-500'
    if (event.title.includes('feat')) return 'bg-green-100 border-green-500'
    return 'bg-blue-100 border-blue-500'
  }}
/>
```

### Custom Day Styling

```tsx
<Calendar
  dayClassName={(date, isCurrentMonth, isToday) => {
    if (isToday) return 'bg-blue-50 border-2 border-blue-300'
    if (!isCurrentMonth) return 'opacity-50'
    return 'hover:bg-gray-50'
  }}
/>
```

### Complete Custom Rendering

```tsx
<Calendar
  renderEvent={(event, date) => (
    <div className="p-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg">
      <div className="font-bold">{event.title}</div>
      <div className="text-xs">{format(event.start, 'HH:mm')}</div>
    </div>
  )}
/>
```

## 🔧 **Ready to Use**

Your `CommitCalendar` component already includes:

- ✅ All your existing functionality
- ✅ Hover popups with commit details
- ✅ Color coding by commit type
- ✅ Repository filtering
- ✅ Month/Week/Day views
- ✅ Dark mode support
- ✅ Responsive design

Just import and use it! 🎉
