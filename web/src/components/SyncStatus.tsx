import { useAppContext } from '@/context/AppContext'
import { CircleAlertIcon } from '../../public/icon/CircleAlertIcon'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useEffect } from 'react'

const fetchSyncStatus = async () => {
  const response = await fetch('/api/syncStatus')
  if (!response.ok) {
    throw new Error(`Error fetching sync status: ${response.status}`)
  }
  return await response.json()
}

const getEmojiTime = (date: Date) => {
  const hours = date.getHours()
  return hours >= 6 && hours < 18 ? '🌞' : '🌜'
}

const SyncStatus = () => {
  const { syncStatus, setSyncStatus } = useAppContext()

  const { data, error, isLoading, isError } = useQuery(
    {
      queryKey: ['syncStatus'],
      queryFn: fetchSyncStatus,
      refetchInterval: 60000,
      refetchOnWindowFocus: true,
    }
  )

  useEffect(() => {
    if (data) {
      setSyncStatus(data)
    }
  }, [data, setSyncStatus])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Last Sync Status</h2>
        </div>
        <p>Loading...</p>
      </div>
    )
  }

  if (isError) {
    return <p>Error: {error?.message}</p>
  }

  const formattedDate = data?.lastSyncDate
    ? `${format(new Date(data.lastSyncDate), 'MMMM do, yyyy h:mm:ss a')} ${getEmojiTime(new Date(data.lastSyncDate))}`
    : data?.statusMessage || 'Loading...'


  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between ">
        <div>
          <h2 className="text-lg font-bold mb-4">Last Sync Status</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Last successful sync: {''}
            <span className="font-bold">{formattedDate}</span>
          </p>
        </div>
        {data && data.errorBranch && (
          <div>
            <p className="text-red-500 dark:text-red-400">
              <CircleAlertIcon className="w-5 h-5 mr-2 inline" />
              {data.statusMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SyncStatus
