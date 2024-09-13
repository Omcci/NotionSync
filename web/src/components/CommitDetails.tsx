import { Avatar, AvatarFallback } from '@radix-ui/react-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from './ui/button'
import { CheckCircle, XCircle } from 'lucide-react'

type CommitDetailsProps = {
  commitDetails: {
    commit: string
    author: string
    date: string
    status?: string
    actions: { name: string; url: string }[]
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
            className="flex items-center justify-between p-2 bg-gray-50 rounded-md shadow-sm hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <Avatar>
                {/* <AvatarImage src={commit.avatar_url || '/default-avatar.png'} alt={commit.author} /> */}
                <AvatarFallback>
                  {commit.author.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-medium">{commit.commit}</h3>
                <p className="text-xs text-gray-500">by {commit.author}</p>
                <p className="text-xs text-gray-400">
                  {new Date(commit.date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {commit.status ? (
                <Badge
                  variant="destructive"
                  className="flex items-center space-x-1"
                >
                  <XCircle className="h-4 w-4" />
                  <span>{commit.status}</span>
                </Badge>
              ) : (
                <Badge
                  variant="default"
                  className="flex items-center space-x-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified</span>
                </Badge>
              )}

              <div className="flex space-x-1">
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
