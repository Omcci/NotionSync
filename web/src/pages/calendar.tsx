import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Commit } from '../../types/types'
import { useRouter } from 'next/router'
import { useAppContext } from '@/context/AppContext'
import SelectComponent from '@/components/SelectComponent'
import ModalCommits from '@/components/ModalCommits'
import { useUser } from '@/context/UserContext'

//TODO : add mistral to make a summary of the day
const CalendarPage = () => {
  const [events, setEvents] = useState([])
  const router = useRouter()
  const user = useUser()

  const [selectedDate, setSelectedDate] = useState('')
  const [commitDetails, setCommitDetails] = useState<Commit[]>([])
  const [open, setOpen] = useState(false)

  const { repos, selectedRepo, setSelectedRepo, setRepos } = useAppContext()
  console.log('repos', repos)
  const { org: orgName, name: repoName } = selectedRepo || {}

  useEffect(() => {
    if (!selectedRepo) return

    const fetchCommits = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      let url = `${apiUrl}/api/commits?repoName=${repoName}&orgName=${orgName}`
      console.log('fetching sync status', url)

      if (selectedDate) {
        url += `&date=${selectedDate}`;
      }
      try {
        const response = await fetch(url)
        console.log('response:', response)
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(
            `Error fetching commits: ${response.status} - ${errorText}`,
          )
        }
        const data = await response.json()
        console.log('data:', data)
        if (selectedDate) {
          setCommitDetails(data);
        } else {
          const formattedEvents = data.map((commit: Commit) => ({
            title: commit.commit,
            date: commit.date,
          }));
          setEvents(formattedEvents);
        }
      } catch (error) {
        console.error('Error fetching commits:', error)
      }
    }
    fetchCommits()
  }, [repoName, orgName, selectedRepo, selectedDate])

  const handleRepoSelect = (repoId: string) => {
    const repo = repos.find((r) => r.id === repoId)
    if (repo) {
      setSelectedRepo(repo)
    }
  }

  const handleDateClick = async (info: any) => {
    setSelectedDate(info.dateStr);
    setCommitDetails([]);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = `${apiUrl}/api/commits?repoName=${repoName}&orgName=${orgName}&date=${info.dateStr}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching commits: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setCommitDetails(data);
      setOpen(true);
    } catch (error) {
      console.error('Error fetching commits:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Commits Calendar</h1>
      <SelectComponent
        placeholder="Select a repository"
        options={user.user ? repos?.map((repo) => ({ value: repo.id, label: repo.name })) : []}
        value={selectedRepo ? selectedRepo.id : ''}
        onChange={handleRepoSelect}
        disabled={!user.user}
      />
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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
