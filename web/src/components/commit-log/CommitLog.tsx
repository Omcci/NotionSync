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
  const theader = ['Commit', 'Branch', 'Author', 'Date', 'Status', 'Actions']
  const lines = [
    {
      commit: 'Implement new feature',
      branch: 'feature/new-page',
      author: 'John Doe',
      date: 'May 15, 2024',
      status: 'Failed',
      actions: ['View', 'Github', 'Notebook'],
    },
    {
      commit: 'Fix bug in login flow',
      branch: 'bugfix/login',
      author: 'Jane Smith',
      date: 'May 14, 2024',
      status: '',
      actions: ['View', 'Github', 'Notebook'],
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Commit Log</h2>
        <CommitLogFilters filters={filters} />
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
            {lines.map((line) => (
              <tr key={line.commit} className="border-b dark:border-gray-700">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <GitCommitVerticalIcon className="w-5 h-5" />
                    <span className="font-medium">{line.commit}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <GitBranchIcon className="w-5 h-5" />
                    <span>{line.branch}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src=" https://github.com/shadcn.png" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <span>{line.author}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{line.date}</td>
                <td className="px-4 py-3">
                  {line.status && (
                    <Badge
                      className="bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-400"
                      variant="outline"
                    >
                      {line.status}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {line.actions.map((action) => {
                      return (
                        <Button key={action} size="icon" variant="ghost">
                          {action === 'View' && <EyeIcon className="w-5 h-5" />}
                          {action === 'Github' && (
                            <GithubIcon className="w-5 h-5" />
                          )}
                          {action === 'Notebook' && (
                            <NotebookIcon className="w-5 h-5" />
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CommitLog
