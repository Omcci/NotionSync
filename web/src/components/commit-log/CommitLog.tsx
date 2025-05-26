import { useEffect, useState } from 'react'
import { CalendarDaysIcon } from '../../../public/icon/CalendarDaysIcon'
import { EyeIcon } from '../../../public/icon/EyeIcon'
import { GitBranchIcon } from '../../../public/icon/GitBranchIcon'
import { GitCommitVerticalIcon } from '../../../public/icon/GitCommitVerticalIcon'
import { UserIcon } from '../../../public/icon/UserIcon'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import CommitLogFilters from './CommitLogFilters'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppContext } from '@/context/AppContext'
import { Action, Commit } from '../../../types/types'
import Link from 'next/link'
import ErrorMessage from '../ErrorMessage'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { LoadingSpinner } from '../ui/loadingspinner'
import { GithubIcon } from '../../../public/icon/GithubIcon'

export type Filter = {
  name: string
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
}

const filters: Filter[] = [
  {
    name: 'Branch',
    icon: GitBranchIcon,
  },
  {
    name: 'Author',
    icon: UserIcon,
  },
  {
    name: 'Date Range',
    icon: CalendarDaysIcon,
  },
]

const fetchCommits = async (
  owner: string,
  repoName: string,
  page: number,
  perPage: number,
) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const githubToken = session?.provider_token
  if (!githubToken) {
    throw new Error('Error: No GitHub token available')
  }

  const repos = [{ owner, name: repoName }]

  const response = await fetch(
    `/api/commits?repos=${encodeURIComponent(JSON.stringify(repos))}&page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
    },
  )
  console.log('Response:', response)
  if (!response.ok) {
    throw new Error(`Error fetching commits: ${response.statusText}`)
  }
  return await response.json()
}

const CommitLog = () => {
  const [searchInput, setSearchInput] = useState<string>('')
  const [page, setPage] = useState(1)
  const commitsPerPage = 10

  const { selectedRepo } = useAppContext()

  const {
    data: commits = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['commits', selectedRepo?.owner, selectedRepo?.name, page],
    queryFn: () =>
      fetchCommits(
        selectedRepo?.owner!,
        selectedRepo?.name!,
        page,
        commitsPerPage,
      ),
    enabled: !!selectedRepo,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  const filteredCommits = Array.isArray(commits)
    ? commits.filter((commit: Commit) =>
      commit.commit.message.toLowerCase().includes(searchInput.toLowerCase()),
    )
    : []

  const theader = ['Commit', 'Branch ID', 'Author', 'Date', 'Status', 'Actions']

  if (!selectedRepo) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Commit Log</h2>
        </div>
        <p>Please select a repository to show the commits.</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Commit Log</h2>
        </div>
        <ErrorMessage message={(error as Error).message} />
      </div>
    )
  }

  const formattedDate = (date: string) => {
    const d = new Date(date)
    return `${d.toLocaleDateString()}`
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 min-h-[400px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold leading-4 sm:leading-none">
          Commit Log
        </h2>
        <div className="flex">
          {selectedRepo && (
            <Link
              href={`/calendar?orgName=${selectedRepo.owner}&repoName=${selectedRepo.name}`}
              passHref
            >
              <Button variant="ghost" className="mr-2">
                <CalendarDaysIcon className="w-5 h-5" />
              </Button>
            </Link>
          )}
          <CommitLogFilters
            filters={filters}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <LoadingSpinner className="w-8 h-8 text-gray-500" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                {theader.map((header) => (
                  <th key={header} className="px-4 py-2 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCommits.map((commit, idx) => (
                <tr
                  key={`${commit.commit.tree.sha}-${commit.sha}-${idx}`}
                  className="border-b dark:border-gray-700"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GitCommitVerticalIcon className="w-5 h-5" />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="font-medium truncate max-w-xs">
                              {commit.commit.message.length > 20
                                ? `${commit.commit.message.substring(0, 20)}...`
                                : commit.commit.message}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="tooltip-multiline">
                            <span>{commit.commit.message}</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GitBranchIcon className="w-5 h-5" />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="font-medium truncate max-w-xs">
                              {commit.commit.tree.sha.length > 3
                                ? `${commit.commit.tree.sha.substring(0, 3)}...`
                                : commit.commit.tree.sha}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="tooltip-multiline">
                            <span>{commit.commit.tree.sha}</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer">
                          <Avatar>
                            <AvatarImage src={commit.avatar_url} />
                            <AvatarFallback>
                              {commit.commit.author.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{commit.commit.author.name}</span>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage
                              src={commit.authorDetails?.avatar_url}
                            />
                            <AvatarFallback>
                              {commit.commit.author.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">
                              {commit.authorDetails?.name}
                            </p>
                            <div className="font-medium text-xs">
                              <p>{commit.authorDetails?.bio}</p>
                              <p>{commit.authorDetails?.location}</p>
                              <p>{commit.authorDetails?.company}</p>
                              <p>{commit.authorDetails?.blog}</p>
                              <p>
                                Membre depuis:{' '}
                                {commit.authorDetails?.created_at &&
                                  formattedDate(
                                    commit.authorDetails.created_at,
                                  )}{' '}
                              </p>
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </td>
                  <td className="px-4 py-3">
                    {formattedDate(commit.date || commit.commit.author.date)}
                  </td>
                  <td className="px-4 py-3">
                    {commit.status && (
                      <div>
                        <Badge
                          className={`${commit.status === 'Verified'
                              ? 'bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-400'
                              : 'bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-400'
                            }`}
                          variant="outline"
                        >
                          {commit.status}
                        </Badge>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {commit.actions && commit.actions.length > 0 ? (
                        commit.actions.map((action: Action, idx: number) => {
                          return (
                            <TooltipProvider
                              key={`${action.name}-${commit.sha}-${idx}`}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={action.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                    >
                                      {action.name === 'View on GitHub' ? (
                                        <GithubIcon className="w-4 h-4" />
                                      ) : (
                                        <EyeIcon className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{action.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={commit.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                >
                                  <GithubIcon className="w-4 h-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View on GitHub</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-center mt-4">
        <Button
          className="mr-4"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          disabled={commits.length < commitsPerPage}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default CommitLog
