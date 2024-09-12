import { use, useEffect, useState } from 'react'
import { EyeIcon } from '../../public/icon/EyeIcon'
import { GitBranchIcon } from '../../public/icon/GitBranchIcon'
import { GithubIcon } from '../../public/icon/GithubIcon'
import { NotebookIcon } from '../../public/icon/NotebookIcon'
import SelectComponent from './SelectComponent'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { useAppContext } from '@/context/AppContext'
import ErrorMessage from './ErrorMessage'
import { useUser } from '@/context/UserContext'
import { useQuery } from '@tanstack/react-query'

interface Branch {
  name: string
  label?: string
  status: string
  actions: Array<{ name: string; icon: JSX.Element; url: string }>
}

const fetchBranches = async (repoName: string, orgName: string, githubToken: string, trackedBranch: Set<string>) => {
  const response = await fetch(
    `/api/branches?repoName=${encodeURIComponent(repoName)}&orgName=${encodeURIComponent(orgName)}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
    },
  )
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Error fetching branches: ${response.status}`)
  }
  const detailedBranches = (data.branches || []).map((branchName: string) => ({
    name: branchName,
    status: trackedBranch.has(branchName) ? 'Tracked' : 'Untracked',
    actions: [
      {
        name: 'View',
        icon: <EyeIcon />,
        url: `https://github.com/${orgName}/${repoName}/tree/${branchName}`,
      },
      {
        name: 'Github',
        icon: <GithubIcon />,
        url: `https://github.com/${orgName}/${repoName}`,
      },
    ],
  }))

  return detailedBranches
}

const BranchSelector = () => {
  const { selectedRepo } = useAppContext()
  const { githubToken } = useUser()
  const [selectedBranch, setSelectedBranch] = useState('')
  const [trackedBranch, setTrackedBranch] = useState<Set<string>>(new Set())

  const { data: branches = [], isLoading, isError, error } = useQuery(
    {
      queryKey: ['branches', selectedRepo?.name, selectedRepo?.org, githubToken],
      queryFn: () => fetchBranches(selectedRepo!.name, selectedRepo!.org, githubToken!, trackedBranch),
      enabled: !!selectedRepo && !!githubToken,
      staleTime: 1000 * 60 * 5,
    }
  )

  const handleTrackChange = (branchName: string, isChecked: boolean) => {
    setTrackedBranch((prevTrackedBranch) => {
      const updatedTrackedBranch = new Set(prevTrackedBranch)
      if (isChecked) {
        updatedTrackedBranch.add(branchName)
      } else {
        updatedTrackedBranch.delete(branchName)
      }

      branches.forEach((branch: Branch) => {
        if (branch.name === branchName) {
          branch.status = isChecked ? 'Tracked' : 'Untracked'
        }
      })

      return updatedTrackedBranch
    })
  }

  const handleBranchSelect = (branchName: string) => {
    setSelectedBranch(branchName)
  }

  const branchOptions = branches.map((branch: Branch) => ({
    value: branch.name,
    label: branch.label || branch.name,
  }))

  const renderContent = (message: string) => (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Branch Selector</h2>
      </div>
      <p>{message}</p>
    </div>
  )

  if (!selectedRepo) {
    return renderContent("Please select a repository to show the branches")
  }

  if (isLoading) {
    return renderContent("Loading branches...")
  }

  if (isError) {
    return renderContent(`Error: ${error?.message || "Failed to load branches"}`)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Branch Selector</h2>
        <div className="flex items-center gap-4">
          <SelectComponent
            placeholder="Select a branch"
            options={branchOptions}
            value={selectedBranch}
            onChange={(value) => handleBranchSelect(value)}
            disabled={branches.length === 0}
          />
          {selectedBranch && (
            <div className="flex items-center gap-2">
              <input
                id="track-branch"
                type="checkbox"
                checked={trackedBranch.has(selectedBranch)}
                onChange={(e) => {
                  handleTrackChange(
                    selectedBranch,
                    (e.target as HTMLInputElement).checked,
                  )
                }}
              />
              <Label
                className="text-sm font-medium leading-none"
                htmlFor="track-branch"
              >
                Track Branch
              </Label>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="px-4 py-2 text-left">Branch</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {branches.map((branch: Branch, idx: number) => (
              <tr key={idx} className="border-b dark:border-gray-700">
                <td className="px-4 py-3 flex items-center gap-2">
                  <GitBranchIcon className="w-5 h-5" />
                  {branch.name}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={`bg-${branch.status === 'Tracked'
                      ? 'green-100 text-green-500 dark:bg-green-900 dark:text-green-400'
                      : 'red-100 text-red-500 dark:bg-red-900 dark:text-red-400'
                      }`}
                    variant="outline"
                  >
                    {branch.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  {branch.actions.map((action, actionIdx) => (
                    <Button
                      key={actionIdx}
                      size="icon"
                      variant="ghost"
                      onClick={() => window.open(action.url, '_blank')}
                    >
                      {action.icon}
                    </Button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BranchSelector
