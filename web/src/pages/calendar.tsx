import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Commit } from '../../types/types'

const CalendarPage = () => {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const response = await fetch('/api/github/commits')
        const data = await response.json()
        const formattedEvents = data.map((commit: Commit) => ({
          title: commit.commit,
          date: commit.date,
        }))
        setEvents(formattedEvents)
      } catch (error) {
        console.error('Error fetching commits:', error)
      }
    }

    fetchCommits()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Commits Calendar</h1>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={(info) => alert(`Clicked on date: ${info.dateStr}`)}
        />
      </div>
    </div>
  )
}

export default CalendarPage
