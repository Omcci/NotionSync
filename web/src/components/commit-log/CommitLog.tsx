import { useEffect, useState } from 'react'
import { CalendarDaysIcon } from '../../../public/icon/CalendarDaysIcon'
import { EyeIcon } from '../../../public/icon/EyeIcon'
import { GitBranchIcon } from '../../../public/icon/GitBranchIcon'
import { GitCommitVerticalIcon } from '../../../public/icon/GitCommitVerticalIcon'
import { GithubIcon } from '../../../public/icon/GithubIcon'
import { NotebookIcon } from '../../../public/icon/NotebookIcon'
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

const CommitLog = () => {
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState<string>('')
  const [filteredCommits, setFilteredCommits] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const commitsPerPage = 10

  const { selectedRepo } = useAppContext()
  console.log('Selected Repo:', selectedRepo)

  const fetchCommits = async (page: number) => {
    try {
      const orgName = selectedRepo?.org
      const repoName = selectedRepo?.name
      console.log(`Repo Owner: ${orgName}`)
      console.log(`Repo Name: ${repoName}`)
      const apiUrl = 'http://localhost:3000'
      const response = await fetch(
        `${apiUrl}/api/commits?orgName=${orgName}&repoName=${repoName}&page=${page}&per_page=${commitsPerPage}`,
      )
      console.log('response', response)
      const data = await response.json()
      console.log('DATATA', data)
      setCommits(data)
      setLoading(false)
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  useEffect(() => {
    setFilteredCommits(
      commits.filter((commit) =>
        commit.commit.toLowerCase().includes(searchInput.toLowerCase()),
      ),
    )
  }, [searchInput, commits])

  useEffect(() => {
    if (!selectedRepo) return
    fetchCommits(page)
  }, [selectedRepo, page])

  const theader = ['Commit', 'Sha', 'Author', 'Date', 'Status', 'Actions']

  // if (loading) {
  //   return <p>Loading...</p>
  // }

  if (error) {
    return <p>Error: {error}</p>
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Commit Log</h2>
        <CommitLogFilters
          filters={filters}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
        />
      </div>
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
                key={`${commit.branch}-${commit.sha}-${idx}`}
                className="border-b dark:border-gray-700"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <GitCommitVerticalIcon className="w-5 h-5" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="font-medium truncate max-w-xs">
                            {commit.commit.length > 20
                              ? `${commit.commit.substring(0, 20)}...`
                              : commit.commit}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="tooltip-multiline">
                          <span>{commit.commit}</span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <GitBranchIcon className="w-5 h-5" />
                    <span>{commit.branch}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={commit.avatar_url} />
                      <AvatarFallback>{commit.author[0]}</AvatarFallback>
                    </Avatar>
                    <span>{commit.author}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {new Date(commit.date).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {commit.status && (
                    <Badge
                      className="bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-400"
                      variant="outline"
                    >
                      {commit.status}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {commit.actions.map((action: any, idx: number) => {
                      return (
                        <Link
                          key={`${action.name}-${commit.sha}-${idx}`}
                          href={action.url}
                          passHref
                        >
                          <Button size="icon" variant="ghost">
                            {action.name === 'View' && (
                              <EyeIcon className="w-5 h-5" />
                            )}
                            {action.name === 'Github' && (
                              <GithubIcon className="w-5 h-5" />
                            )}
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
