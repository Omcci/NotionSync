import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Commit } from '../../types/types'
import { useEffect, useState } from 'react'
import CommitDetails from './CommitDetails'
import { LoadingSpinner } from './ui/loadingspinner'
import { Calendar, GitCommit, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

type ModalCommitsProps = {
  open: boolean
  setOpen: (open: boolean) => void
  selectedDate: string
  commitDetails: Commit[]
  isLoading: boolean
  isError: boolean
  error?: Error | null
}

const ModalCommits = ({
  open,
  setOpen,
  selectedDate,
  commitDetails,
  isLoading,
  isError,
  error,
}: ModalCommitsProps) => {
  const formattedDate = selectedDate
    ? format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')
    : 'Selected Date'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="hidden">Open</button>
      </DialogTrigger>
      <DialogContent
        className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        aria-describedby={undefined}
      >
        {/* Enhanced Header */}
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Development Activity
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formattedDate}
              </p>
            </div>
            {!isLoading && !isError && commitDetails.length > 0 && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                <GitCommit className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {commitDetails.length} commit
                  {commitDetails.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              {/* Enhanced loading animation */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <LoadingSpinner className="w-6 h-6 text-blue-500" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Loading commits...
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                  Fetching your development activity for{' '}
                  {format(new Date(selectedDate), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Progress indicators */}
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1s',
                    }}
                  />
                ))}
              </div>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 font-medium">
                  Failed to load commits
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {error?.message || 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          ) : commitDetails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <GitCommit className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  No commits found
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  No development activity recorded for this date
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <CommitDetails
                commitDetails={commitDetails}
                selectedDate={selectedDate}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ModalCommits
