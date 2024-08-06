import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Commit } from '../../types/types';
import { useRouter } from 'next/router';
import { useAppContext } from '@/context/AppContext';
import SelectComponent from '@/components/SelectComponent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ModalCommits from '@/components/ModalCommits';

//TODO : add mistral to make a summary of the day
const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const router = useRouter();
  // const { orgName, repoName } = router.query;
  // console.log('orgName:', orgName);
  // console.log('repoName:', repoName);

  const [selectedDate, setSelectedDate] = useState('');
  const [commitDetails, setCommitDetails] = useState<Commit[]>([]);
  const [open, setOpen] = useState(false);

  const { repos, selectedRepo, setSelectedRepo, setRepos } = useAppContext();
  console.log('repos', repos)
  const { org: orgName, name: repoName } = selectedRepo || {};

  // useEffect(() => {
  //   const fetchRepos = async () => {
  //     if (repos?.length === 0) {
  //       const username = process.env.NEXT_PUBLIC_USERNAME;
  //       const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  //       const url = `${apiUrl}/api/repos?username=${encodeURIComponent(username!)}`;

  //       try {
  //         const response = await fetch(url);
  //         if (!response.ok) {
  //           throw new Error(`Error fetching repositories: ${response.status}`);
  //         }
  //         const data = await response.json();
  //         setRepos(data.repos);
  //       } catch (error) {
  //         console.error('Failed to fetch repositories:', error);
  //       }
  //     }
  //   };

  //   fetchRepos();
  // }, [repos, setRepos]);


  useEffect(() => {
    if (!selectedRepo) return;

    const fetchCommits = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = `${apiUrl}/api/commits?repoName=${repoName}&orgName=${orgName}`;
      console.log('fetching sync status', url);

      try {
        const response = await fetch(url);
        console.log('response:', response);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error fetching commits: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log('data:', data);
        const formattedEvents = data.map((commit: Commit) => ({
          title: commit.commit,
          date: commit.date,
        }))
        setEvents(formattedEvents)
      } catch (error) {
        console.error('Error fetching commits:', error)
      }
    };
    fetchCommits();
  }, [repoName, orgName, selectedRepo]);


  const handleRepoSelect = (repoId: string) => {
    const repo = repos.find((r) => r.id === repoId);
    if (repo) {
      setSelectedRepo(repo);
    }
  };

  const handleDateClick = async (info: any) => {
    setSelectedDate(info.dateStr);
    setOpen(true);
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
    } catch (error) {
      console.error('Error fetching commits:', error);
    }
  };


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Commits Calendar</h1>
      <SelectComponent
        placeholder="Select a repository"
        options={repos?.map(repo => ({ value: repo.id, label: repo.name }))}
        value={selectedRepo ? selectedRepo.id : ''}
        onChange={handleRepoSelect}
      />
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
        />
      </div>
      {/* <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="hidden">Open</button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[75vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Commits on {selectedDate}</DialogTitle>
          </DialogHeader>
          {commitDetails.length === 0 ? (
            <p className="text-gray-500">No commits found for this date.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {commitDetails.map((commit, idx) => (
                <li key={idx} className="p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={commit.authorDetails.avatar_url}
                      alt={`${commit.author}'s avatar`}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-lg font-semibold">{commit.commit}</p>
                      <p className="text-gray-500">Author: {commit.author}</p>
                      <p className="text-gray-500">Date: {new Date(commit.date).toLocaleString()}</p>
                      <p className="text-gray-500">Status: {commit.status}</p>
                      <div className="mt-2">
                        {commit.actions.map((action, actionIdx) => (
                          <a
                            key={actionIdx}
                            href={action.url}
                            className="text-blue-500 hover:underline mr-4"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {action.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>

      </Dialog> */}

      <ModalCommits open={open} setOpen={setOpen} selectedDate={selectedDate} commitDetails={commitDetails} />

    </div>
  )
}

export default CalendarPage
