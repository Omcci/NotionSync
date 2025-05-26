import { Avatar, AvatarFallback } from '@radix-ui/react-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from './ui/button'
import { CheckCircle, XCircle, Sparkles } from 'lucide-react'
import { AvatarImage } from './ui/avatar'
import { useEffect, useState } from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select'
import { LoadingSpinner } from './ui/loadingspinner'
import { useToast } from './ui/use-toast'
import { Commit } from '../../types/types'

type CommitDetailsProps = {
  commitDetails: Commit[]
}

const CommitDetails = ({ commitDetails }: CommitDetailsProps) => {
  const [filteredCommits, setFilteredCommits] = useState(commitDetails)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    const users = Array.from(
      new Set(commitDetails.map((commit) => commit.commit.author.name)),
    )
    setUniqueUsers(users)
  }, [commitDetails])

  useEffect(() => {
    if (selectedUser) {
      setFilteredCommits(
        commitDetails.filter(
          (commit) => commit.commit.author.name === selectedUser,
        ),
      )
    } else {
      setFilteredCommits(commitDetails)
    }
  }, [selectedUser, commitDetails])

  const SUMMARY_LIMIT = 15

  const checkSummaryLimit = () => {
    const currentCount = parseInt(
      localStorage.getItem('summaryCount') || '0',
      10,
    )
    return currentCount < SUMMARY_LIMIT
  }

  const incrementSummaryCount = () => {
    let currentCount = parseInt(localStorage.getItem('summaryCount') || '0', 10)
    currentCount += 1
    localStorage.setItem('summaryCount', currentCount.toString())
  }

  const generateSummaryForAllCommits = async () => {
    if (!checkSummaryLimit()) {
      toast({
        title: 'Summary limit reached',
        description: 'You can only generate 5 summaries per day.',
        variant: 'destructive',
      })
      return
    }
    setIsLoadingSummary(true)
    const commits = filteredCommits.map((commit) => ({
      commitMessage: commit.commit.message,
      diff:
        Array.isArray(commit.diff) && commit.diff.length > 0
          ? commit.diff
              .map((d) => `${d.filename}: +${d.additions}, -${d.deletions}`)
              .join('\n')
          : '',
    }))

    try {
      const response = await fetch('/api/mistral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commits,
        }),
      })

      const data = await response.json()
      setSummary(data.summary)
      incrementSummaryCount()
      console.log('Summary count:', localStorage.getItem('summaryCount'))
    } catch (error) {
      console.error('Failed to generate summary:', error)
      toast({
        title: 'Failed to generate summary',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingSummary(false)
    }
  }

  if (commitDetails.length === 0) {
    return <p className="text-gray-500">No commits found for this date.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="w-full max-w-32 ">
          <Select
            onValueChange={(value) =>
              setSelectedUser(value === 'all' ? null : value)
            }
            disabled={uniqueUsers.length === 0 || uniqueUsers.length === 1}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent>
              {uniqueUsers.map((user, idx) => (
                <SelectItem key={idx} value={user}>
                  {user}
                </SelectItem>
              ))}
              <SelectItem value="all">Show All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full flex flex-row justify-around items-center">
          <h3 className="font-bold text-gray-500 dark:text-gray-300 flex">
            {' '}
            Summarize your commits here{' '}
            <Sparkles
              className="ml-4 cursor-pointer"
              onClick={generateSummaryForAllCommits}
            />
          </h3>
          <div className="ml-4">{isLoadingSummary && <LoadingSpinner />}</div>
          <span className="text-gray-600 dark:text-gray-400">
            {commitDetails.length} commit{commitDetails.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      {summary && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mt-4">
          <div className="whitespace-pre-wrap">{summary}</div>
        </div>
      )}
      <ul className="space-y-2">
        {filteredCommits.map((commit, idx) => {
          const status = commit.status || 'Unverified'
          const avatarUrl =
            commit.avatar_url ||
            commit.committer?.avatar_url ||
            commit.authorDetails?.avatar_url

          return (
            <li
              key={idx}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="min-w-8 h-8 rounded-full flex justify-center items-center bg-white dark:bg-gray-900">
                  <Avatar>
                    <AvatarImage
                      className="w-8 h-8 rounded-full "
                      src={avatarUrl}
                      alt={commit.commit.author.name}
                    />
                    <AvatarFallback className="w-8 h-8 rounded-full ">
                      {commit.commit.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {commit.commit.message}
                  </h3>
                  <p className="text-xs text-gray-500">
                    by{' '}
                    <span className="font-bold text-blue-400 dark:text-blue-300">
                      {' '}
                      {commit.commit.author.name}{' '}
                    </span>{' '}
                    at{' '}
                    {new Date(commit.commit.author.date).toLocaleString(
                      'en-US',
                      {
                        timeZone: 'UTC',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      },
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto sm:space-x-2 space-y-2 sm:space-y-0 mt-4 sm:mt-0">
                {status === 'Verified' ? (
                  <Badge className="flex items-center space-x-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{status}</span>
                  </Badge>
                ) : (
                  <Badge className="flex items-center space-x-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>{status}</span>
                  </Badge>
                )}
                <div className="flex flex-col sm:flex-row sm:space-x-1 space-y-1 sm:space-y-0">
                  {commit.actions?.map((action, actionIdx) => (
                    <Button
                      key={actionIdx}
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(action.url, '_blank')}
                    >
                      {action.name}
                    </Button>
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default CommitDetails
