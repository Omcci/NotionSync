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
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loadingspinner'

const fetchCommits = async (
  repoName: string,
  orgName: string,
  dateRange: { start: string; end: string },
  selectedDate?: string,
) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const githubToken = session?.provider_token
  if (!githubToken) {
    throw new Error('Unauthorized: No GitHub token available')
  }

  let commitsUrl = `/api/commits?repoName=${repoName}&orgName=${orgName}&startDate=${dateRange.start}&endDate=${dateRange.end}&allPages=true&githubToken=${githubToken}`
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

  const {
    data: commitData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'commits',
      repoName,
      orgName,
      dateRange.start,
      dateRange.end,
    ],
    queryFn: () => fetchCommits(repoName!, orgName!, dateRange),
    enabled: !!repoName && !!orgName && !!dateRange.start && !!dateRange.end,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  useEffect(() => {
    if (!commitData || isError) return;

    const formattedEvents = commitData.map((commit: Commit) => ({
      title: commit.commit,
      date: commit.date,
    }));
    setEvents(formattedEvents);

    if (selectedDate) {
      const filteredCommits = commitData.filter(
        (commit: Commit) => {
          const commitDate = commit.date.split('T')[0];
          return commitDate === selectedDate;
        }
      );
      setCommitDetails(filteredCommits);
    }
  }, [commitData, selectedDate, isError]);


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

  useEffect(() => {
    const titleEl = document.querySelector('.fc-toolbar-title') as HTMLElement
    if (titleEl) {
      titleEl.style.fontSize = '1.5rem'
      titleEl.style.fontWeight = 'bolder'
      titleEl.classList.add('text-gray-800', 'dark:text-gray-100')
    }

    const buttonEls = document.querySelectorAll<HTMLElement>('.fc-button')
    buttonEls.forEach((button) => {
      button.style.padding = '0.3rem 0.6rem'
      button.style.fontSize = '0.8rem'
      button.classList.add(
        'text-gray-800',
        'dark:text-gray-200',
        'bg-gray-100',
        'dark:bg-gray-700',
        'border-gray-300',
        'dark:border-gray-600',
        'hover:bg-gray-200',
        'dark:hover:bg-gray-600',
      )
    })

    const headerEls = document.querySelectorAll<HTMLElement>(
      '.fc-col-header-cell',
    )
    headerEls.forEach((header) => {
      header.classList.remove('text-white')
      header.classList.add('text-gray-800', 'dark:text-gray-800')
    })

    const dayCells = document.querySelectorAll<HTMLElement>('.fc-daygrid-day')
    dayCells.forEach((cell) => {
      cell.classList.add('bg-gray-50', 'dark:bg-gray-800')
      cell.addEventListener('mouseenter', () => {
        cell.classList.add('bg-gray-200', 'dark:bg-gray-700')
      })
      cell.addEventListener('mouseleave', () => {
        cell.classList.remove('bg-gray-200', 'dark:bg-gray-700')
      })
      cell.style.cursor = 'pointer'
    })

    const eventEls = document.querySelectorAll<HTMLElement>('.fc-event')
    eventEls.forEach((event) => {
      event.classList.add('text-black', 'dark:text-white', 'cursor-pointer')
    })
  }, [events])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold light:text-gray-800 dark:text-white">
        Calendar
      </h1>
      <h3 className="text-lg light:text-gray-500 dark:text-gray-400 mb-4">
        Deep dive into your GitHub commits by selecting a repository and a date.
      </h3>
      <div className="mb-4 max-w-52">
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
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-gray-100 dark:bg-gray-900 z-10">
            <LoadingSpinner />
          </div>
        )}
        <Card className="bg-gray-50 dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden py-4">
          <CardContent>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              dayMaxEvents={5}
              timeZone="Europe/Paris"
              // eventClassNames={() => 'text-xs truncate'}
              dateClick={handleDateClick}
              datesSet={handleDatesSet}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek',
              }}
              height="auto"
            />
          </CardContent>
        </Card>
      </div>

      <ModalCommits
        open={open}
        setOpen={setOpen}
        selectedDate={selectedDate}
        commitDetails={commitDetails}
        isLoading={isLoading}
        isError={isError}
        error={error}
      />
    </div>
  )
}

export default CalendarPage
