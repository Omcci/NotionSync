import { SyncStatus, useAppContext } from '@/context/AppContext'
import { FolderSyncIcon } from '../../public/icon/FolderSyncIcon'
import { GithubIcon } from '../../public/icon/GithubIcon'
import { RepeatIcon } from '../../public/icon/RepeatIcon'
import SelectComponent from './SelectComponent'
import { Button } from './ui/button'
import { Select } from './ui/select'
import { Toggle } from './ui/toggle'
import { useToast } from './ui/use-toast'
import { useEffect, useRef, useState } from 'react'
import { useConfigContext } from '@/context/ConfigContext'
import { StopCircleIcon } from 'lucide-react'
// import { signIn, signOut, useSession } from "next-auth/react";
//TODO : add session with github oauth
//TODO : display user friendly message of sync status

const apiUrl = process.env.NEXT_PUBLIC_API_URL

const HeaderV0 = () => {
  const { repos, setRepos, selectedRepo, setSelectedRepo, setSyncStatus } =
    useAppContext()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { updateFormValues } = useConfigContext()
  // const { data: session } = useSession();
  const username = process.env.NEXT_PUBLIC_USERNAME
  const syncAbortController = useRef<AbortController | null>(null)

  useEffect(() => {
    if (username) fetchUserRepos(username)
    console.log('username:', username)
  }, [username])

  const fetchUserRepos = async (username: string) => {
    const url = `${apiUrl}/api/repos?username=${encodeURIComponent(username)}`
    console.log('URL:', url)

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Error fetching repositories: ${response.status}`)
      }
      const data = await response.json()
      if (data.repos) {
        setRepos(data.repos)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch repositories.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch repositories.',
        variant: 'destructive',
      })
    }
  }

  const updateSyncStatus = async (status: SyncStatus) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const url = `${apiUrl}/api/syncStatus`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status),
      })
      if (!response.ok) {
        throw new Error(`Error updating sync status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Sync status updated:', data)
      setSyncStatus(data)
    } catch (error) {
      console.error('Failed to update sync status:', error)
    }
  }

  const handleSync = async () => {
    setLoading(true)
    syncAbortController.current = new AbortController()
    try {
      const response = await fetch('/api/sync?action=sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
        signal: syncAbortController.current.signal,
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: 'Success', description: data.message })
        setSyncStatus(data.syncStatus)
      } else {
        console.log('Error:', data)
        toast({
          title: 'Error',
          description: data.details || 'Sync failed. Please try again later.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        toast({
          title: 'Info',
          description: 'Sync was aborted.',
          variant: 'destructive',
        })
        updateSyncStatus({
          errorBranch: null,
          statusMessage: 'Sync process aborted',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Sync failed. Please try again later.',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
      syncAbortController.current = null
    }
  }
  const handleStopSync = async () => {
    if (syncAbortController.current) {
      syncAbortController.current.abort()
      syncAbortController.current = null
      try {
        const response = await fetch('/api/sync?action=stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await response.json()
        if (response.ok) {
          toast({
            title: 'Info',
            description: data.message,
            variant: 'destructive',
          })
          updateSyncStatus({
            errorBranch: null,
            statusMessage: 'Sync process aborted',
          })
        } else {
          toast({
            title: 'Error',
            description:
              data.details || 'Failed to stop sync. Please try again later.',
            variant: 'destructive',
          })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to stop sync. Please try again later.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRepoSelect = (repoId: string) => {
    const repo = repos.find((r) => r.id === repoId)
    if (repo) {
      setSelectedRepo(repo)
      updateFormValues(repo.name, repo.org)
    } else {
      setSelectedRepo(null)
    }
  }

  const repoOptions = repos.map((repo) => ({
    value: repo.id,
    label: repo.name,
  }))
  return (
    <header className="py-4 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost">
          <GithubIcon className="w-5 h-5 mr-2" />
          Login with GitHub
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <SelectComponent
          placeholder="Select a repository"
          options={repoOptions}
          value={selectedRepo ? selectedRepo.id : ''}
          onChange={(id) => handleRepoSelect(id)}
        />
        <Button
          variant="ghost"
          onClick={handleSync}
          disabled={!selectedRepo || loading}
        >
          <FolderSyncIcon className="w-5 h-5 mr-2" />
          {loading ? 'Syncing...' : 'Start Sync'}
        </Button>
        {loading && (
          <Button variant="ghost" onClick={handleStopSync} disabled={!loading}>
            <StopCircleIcon className="w-5 h-5 mr-2" />
            Stop Sync
          </Button>
        )}
        <Toggle aria-label="Automatic Sync">
          {' '}
          {/* TODO : add automatic sync //  */}
          <RepeatIcon className="w-5 h-5" />
        </Toggle>
      </div>
    </header>
  )
}
export default HeaderV0
