import { Avatar, AvatarFallback } from '@radix-ui/react-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from './ui/button'
import { CheckCircle, XCircle } from 'lucide-react'
import { AvatarImage } from './ui/avatar'

type CommitDetailsProps = {
  commitDetails: {
    commit: string
    author: string
    date: string
    status?: string
    actions: { name: string; url: string }[]
    avatar_url?: string
  }[]
}

const CommitDetails = ({ commitDetails }: CommitDetailsProps) => {
  if (commitDetails.length === 0) {
    return <p className="text-gray-500">No commits found for this date.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-500">
          {' '}
          Summarize your commits with AI here
        </h3>

        <button className="text-blue-500">Click Here</button>
        <span className="text-gray-600">
          {commitDetails.length} commit{commitDetails.length > 1 ? 's' : ''}
        </span>
      </div>

      <ul className="space-y-2">
        {commitDetails.map((commit, idx) => (
          <li
            key={idx}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-gray-50 rounded-md shadow-sm hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage
                  className="w-8 h-8 rounded-full object-cover"
                  src={commit.avatar_url || '/default-avatar.png'}
                  alt={commit.author}
                />
                <AvatarFallback>
                  {commit.author.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-medium">{commit.commit}</h3>
                <p className="text-xs text-gray-500">
                  by <span className="font-bold text-blue-400"> {commit.author} </span> at{' '}
                  {new Date(commit.date).toLocaleString('en-US', {
                    timeZone: 'UTC',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto sm:space-x-2 space-y-2 sm:space-y-0 mt-4 sm:mt-0">
              {commit.status === 'Verified' ? (
                <Badge className="flex items-center space-x-1 bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{commit.status}</span>
                </Badge>
              ) : (
                <Badge className="flex items-center space-x-1 bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>{commit.status}</span>
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
        ))}
      </ul>
    </div>
  )
}

export default CommitDetails
