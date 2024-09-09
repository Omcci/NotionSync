import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Commit } from '../../types/types'
import { useAppContext } from '@/context/AppContext'
import SelectComponent from '@/components/SelectComponent'
import ModalCommits from '@/components/ModalCommits'
import { useUser } from '@/context/UserContext'
import { supabase } from '@/lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'

//TODO : add mistral to make a summary of the day
const fetchCommits = async (repoName: string, orgName: string, dateRange: { start: string, end: string }, selectedDate?: string) => {
  const { data: { session } } = await supabase.auth.getSession()
  const githubToken = session?.provider_token
  if (!githubToken) {
    throw new Error('Unauthorized: No GitHub token available')
  }

  let commitsUrl = `/api/commits?repoName=${repoName}&orgName=${orgName}&startDate=${dateRange.start}&endDate=${dateRange.end}&allPages=true&githubToken=${githubToken}`
  if (selectedDate) {
    commitsUrl += `&date=${selectedDate}`
  }
  const response = await fetch(commitsUrl, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error fetching commits: ${response.status} - ${errorText}`)
  }
  return await response.json()
}

const CalendarPage = () => {
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [commitDetails, setCommitDetails] = useState<Commit[]>([])
  const [open, setOpen] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const user = useUser()

  const { repos, selectedRepo, setSelectedRepo } = useAppContext()
  // console.log('repos', repos)
  const { org: orgName, name: repoName } = selectedRepo || {}

  const { data: commitData, isLoading, isError } = useQuery({
    queryKey: ['commits', repoName, orgName, dateRange, selectedDate],
    queryFn: () => fetchCommits(repoName!, orgName!, dateRange, selectedDate),
    enabled: !!repoName && !!orgName && !!dateRange.start && !!dateRange.end,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!commitData || isError) return

    if (selectedDate) {
      setCommitDetails(commitData)
    } else {
      const formattedEvents = commitData.map((commit: Commit) => ({
        title: commit.commit,
        date: commit.date,
      }))
      setEvents(formattedEvents)
    }
  }, [commitData, selectedDate, isError])

  const handleRepoSelect = (repoId: string) => {
    const repo = repos.find((r) => r.id === repoId)
    if (repo) {
      setSelectedRepo(repo)
    }
  }

  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr)
    setOpen(true)
  }

  const handleDatesSet = (info: any) => {
    setDateRange({
      start: info.startStr,
      end: info.endStr,
    })
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold ">Calendar.</h1>
      <h3 className='text-lg text-gray-400 mb-4 '> Deep dive into your github commits by selecting a repository and a date.
      </h3>
      <div className='mb-4'>
        <SelectComponent
          placeholder="Select a repository"
          options={
            user.user
              ? repos?.map((repo) => ({ value: repo.id, label: repo.name }))
              : []
          }
          value={selectedRepo ? selectedRepo.id : ''}
          onChange={handleRepoSelect}
          disabled={!user.user}
        />
      </div>
      <div className="bg-white rounded-lg overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }}
          eventClassNames={() => ' text-xs truncate'}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
        />
      </div>
      <ModalCommits
        open={open}
        setOpen={setOpen}
        selectedDate={selectedDate}
        commitDetails={commitDetails}
      />
    </div>
  )
}

export default CalendarPage
