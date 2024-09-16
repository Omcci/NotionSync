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
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLoading) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 10))
      }, 100)
    } else {
      setProgress(0)
    }
    return () => clearInterval(interval)
  }, [isLoading])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="hidden">Open</button>
      </DialogTrigger>
      <DialogContent
        className="max-w-3xl overflow-y-auto max-h-[75vh]"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Commits on {selectedDate}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Progress className="w-full" value={progress} />
          </div>
        ) : isError ? (
          <p className="text-red-500">
            Error: {error?.message || 'Failed to fetch commits.'}
          </p>
        ) : commitDetails.length === 0 ? (
          <p className="text-gray-500">No commits found for this date.</p>
        ) : (
          <CommitDetails commitDetails={commitDetails} />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ModalCommits
