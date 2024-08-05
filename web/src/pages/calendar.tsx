import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Commit } from '../../types/types';
import { useRouter } from 'next/router';
import { useAppContext } from '@/context/AppContext';
import SelectComponent from '@/components/SelectComponent';

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const router = useRouter();
  // const { orgName, repoName } = router.query;
  // console.log('orgName:', orgName);
  // console.log('repoName:', repoName);

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
        }));
        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching commits:', error);
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
          dateClick={(info) => alert(`Clicked on date: ${info.dateStr}`)}
        />
      </div>
    </div>
  );
};

export default CalendarPage;
