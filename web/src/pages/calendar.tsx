import React, { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Commit } from '../../types/types'
import { useAppContext } from '@/context/AppContext'
import SelectComponent from '@/components/SelectComponent'
import ModalCommits from '@/components/ModalCommits'
import { useUser } from '@/context/UserContext'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import { getGitHubToken } from '@/lib/auth'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarDaysIcon } from '../../public/icon/CalendarDaysIcon'
import { format } from 'date-fns'

const fetchCommits = async (repos: { name: string; owner: string }[], dateRange: { start: string; end: string }) => {
  const githubToken = await getGitHubToken();

  const commitsUrl = `/api/commits?repos=${encodeURIComponent(JSON.stringify(repos))}&startDate=${dateRange.start}&endDate=${dateRange.end}&githubToken=${githubToken}`;

  const response = await fetch(commitsUrl, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching commits: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
};


const CalendarPage = () => {
  const [events, setEvents] = useState<any[]>([])
  const [filteredCommits, setFilteredCommits] = useState<Commit[]>([])

  const [selectedDate, setSelectedDate] = useState('')
  const [commitDetails, setCommitDetails] = useState<Commit[]>([])
  const [open, setOpen] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const user = useUser()
  const calendarRef = useRef<FullCalendar>(null);

  const { repos, selectedRepo, setSelectedRepo } = useAppContext()
  console.log('repos', repos)
  // const orgName = repos.length > 0 ? repos[0].org : ""

  console.log('Repos in CalendarPage:', repos.map(repo => ({ name: repo.name, owner: repo.owner })));

  const {
    data: commitData = [],
    isLoading,
    isError,
    error,
    isFetching
  } = useQuery({
    queryKey: ['commits', repos, dateRange.start, dateRange.end],
    queryFn: () => fetchCommits(repos.map(repo => ({ name: repo.name, owner: repo.owner })), dateRange),
    enabled: !!repos.length && !!dateRange.start && !!dateRange.end,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
  console.log('Commit dataINCALENDAR:', commitData)

  useEffect(() => {
    if (!commitData || isError) return;

    let commitsToUse = commitData;

    // filter the commits by the selected repo
    if (selectedRepo) {
      commitsToUse = commitData.filter((commit: Commit) => commit.repoName === selectedRepo.name);
    }

    const groupedCommits: Record<string, Record<string, { displayed: Partial<Commit>[], total: number }>> = {};

    // group commits by date and repo
    for (const commit of commitsToUse) {
      if (commit.date && commit.repoName) {
        const date = commit.date.split('T')[0];

        if (!groupedCommits[date]) {
          groupedCommits[date] = {};
        }

        if (!groupedCommits[date][commit.repoName]) {
          groupedCommits[date][commit.repoName] = { displayed: [], total: 0 };
        }

        groupedCommits[date][commit.repoName].total += 1;

        if (groupedCommits[date][commit.repoName].displayed.length < 5) {
          groupedCommits[date][commit.repoName].displayed.push(commit);
        }
      }
    }

    const formattedEvents = [];
    for (const date in groupedCommits) {
      for (const repoName in groupedCommits[date]) {
        const { displayed, total } = groupedCommits[date][repoName];
        let title;

        // function to truncate commit message
        const getTruncatedCommitMessage = (commit: any, length: number) => {
          const message = typeof commit === 'string' ? commit : commit?.message || '';
          return message.length > length ? `${message.substring(0, length)}...` : message;
        };

        // truncate text content
        const truncate = (text: string, length: number) =>
          text.length > length ? `${text.substring(0, length)}...` : text;

        // title gen logic
        if (selectedRepo) {
          title = displayed.length === 1
            ? `<span class="font-bold text-base sm:text-sm md:text-base lg:text-lg whitespace-nowrap overflow-hidden text-ellipsis">${getTruncatedCommitMessage(displayed[0].commit, 30)}</span>`
            : `<span class="font-bold text-base sm:text-sm md:text-base lg:text-lg whitespace-nowrap overflow-hidden text-ellipsis">${total} commits</span>`;
        } else {
          title = displayed.length === 1
            ? `<span class="font-bold text-base sm:text-sm md:text-base lg:text-lg whitespace-nowrap overflow-hidden text-ellipsis">${truncate(repoName, 15)}</span> <span class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">${getTruncatedCommitMessage(displayed[0].commit, 30)}</span>`
            : `<span class="font-bold text-base sm:text-sm md:text-base lg:text-lg whitespace-nowrap overflow-hidden text-ellipsis">${truncate(repoName, 15)}</span> <span class="text-sm text-gray-500 dark:text-gray-400">${total} commits</span>`;
        }

        formattedEvents.push({
          title,
          date,
          allDay: true,
          displayOrder: formattedEvents.length, // Use the current length for display order
        });
      }
    }

    if (JSON.stringify(formattedEvents) !== JSON.stringify(events)) {
      setEvents(formattedEvents);
      setFilteredCommits(commitsToUse);
    }
  }, [commitData, selectedRepo, isError, events]);

  useEffect(() => {
    if (!selectedDate) return;

    const selectedCommits = filteredCommits.filter((commit: Commit) => {
      const commitDate = commit.date?.split('T')[0];
      return commitDate === selectedDate;
    });

    setCommitDetails(selectedCommits);
  }, [selectedDate, filteredCommits]);

  const handleRepoSelect = (repoId: string) => {
    if (repoId === 'all') {
      setSelectedRepo(null);
    } else {
      const repo = repos.find((r) => r.id === repoId);
      setSelectedRepo(repo || null);
    }
  };

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

  const handleDateSelect = (date?: Date) => {
    const newDate = date ? date.toISOString().split('T')[0] : '';
    setSelectedDate(newDate);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(new Date(newDate));
    }
  };

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
              ? [{ value: 'all', label: 'All Repositories' }, ...repos?.map((repo) => ({ value: repo.id, label: repo.name }))]
              : []
          }
          value={selectedRepo ? selectedRepo.id : 'all'}
          onChange={handleRepoSelect}
          disabled={!user.user}
        />
      </div>
      <div className="relative">
        {/* {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-gray-100 dark:bg-gray-900 z-10">
            <LoadingSpinner />
          </div>
        )} */}
        <Card className="bg-gray-50 dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden py-4">
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="my-3 w-[280px] justify-start text-left font-normal">
                  <CalendarDaysIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(new Date(selectedDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-2 sm:w-[300px] flex justify-center items-center">
                <div className="flex justify-center items-center w-full">
                  <Calendar
                    mode="single"
                    selected={new Date(selectedDate)}
                    onSelect={handleDateSelect}
                    className="border rounded-md shadow-sm dark:bg-gray-800"
                  />
                </div>
              </PopoverContent>
            </Popover>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              dayMaxEvents={false}
              timeZone="Europe/Paris"
              eventContent={(arg) => ({
                html: `
                  <div class="text-xs my-1 p-1 rounded bg-white text-black dark:bg-gray-700 dark:text-white border-none shadow-sm whitespace-normal overflow-visible">
                    ${arg.event.title}
                  </div>
                `,
              })}
              titleFormat={{ year: 'numeric', month: 'long' }}
              dateClick={handleDateClick}
              datesSet={handleDatesSet}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek',
              }}
              height="auto"
              dayCellDidMount={(arg) => {
                const dateStr = arg.date.toISOString().split('T')[0]
                if (isFetching && dateStr >= dateRange.start && dateStr <= dateRange.end) {
                  const spinner = document.createElement('div')
                  spinner.className = 'absolute bottom-1 right-1 w-4 h-4'
                  spinner.innerHTML = '<LoadingSpinner />'
                  arg.el.appendChild(spinner)
                }
              }}
            />
          </CardContent>
        </Card>
        {isFetching && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <LoadingSpinner />
          </div>
        )}
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
