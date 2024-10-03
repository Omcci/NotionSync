import { useAppContext } from '@/context/AppContext'
import { FolderSyncIcon } from '../../public/icon/FolderSyncIcon'
import { GithubIcon } from '../../public/icon/GithubIcon'
import { RepeatIcon } from '../../public/icon/RepeatIcon'
import SelectComponent from './SelectComponent'
import { Button } from './ui/button'
import { Select } from './ui/select'
import { Toggle } from './ui/toggle'
import { useToast } from './ui/use-toast'
import { useEffect, useState } from 'react'
import { useConfigContext } from '@/context/ConfigContext'
import ConfigSettings from './config-settings/ConfigSettings'
import signInWithGitHub from '@/lib/login'
import { useUser } from '@/context/UserContext'
import BranchSelector from './BranchSelector'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { GitBranchIcon } from '../../public/icon/GitBranchIcon'

// import { signIn, signOut, useSession } from "next-auth/react";
//TODO : add session with github oauth
//TODO : display user friendly message of sync status

const HeaderV0 = () => {
  const { repos, setRepos, selectedRepo, setSelectedRepo } = useAppContext()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { updateFormValues } = useConfigContext()
  // const { data: session } = useSession();
  const username = process.env.NEXT_PUBLIC_USERNAME
  const user = useUser()

  const handleSync = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/sync?action=sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: 'Success', description: data.message })
      } else {
        console.log('Error:', data)
        toast({
          title: 'Error',
          description: data.details || 'Sync failed. Please try again later.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Sync failed. Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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
    <header className="py-4 flex  items-center justify-between">
      <div className="flex  w-full sm:w-auto items-center gap-4 justify-center sm:justify-start">
        <div className='className="w-[100px] sm:w-[180px]"'>
          <SelectComponent
            placeholder="Select a repository"
            options={repoOptions}
            value={selectedRepo ? selectedRepo.id : ''}
            onChange={(id) => handleRepoSelect(id)}
            disabled={!user?.user || loading || repos.length === 0 || !username}
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost">
              <GitBranchIcon className="w-5 h-5" />
              <span className="hidden sm:inline ml-2">Select Branch</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:w-1/2">
            <SheetHeader>
              <SheetTitle>Select a Branch</SheetTitle>
            </SheetHeader>
            <BranchSelector />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex w-full sm:w-auto items-center gap-4 justify-center sm:justify-end">
        <Button
          variant="ghost"
          onClick={handleSync}
          disabled={!selectedRepo || loading}
        >
          <FolderSyncIcon className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline ml-2">
            {loading ? 'Syncing...' : 'Start Sync'}
          </span>
        </Button>
        <Toggle aria-label="Automatic Sync">
          <RepeatIcon className="w-5 h-5" />
        </Toggle>
        <ConfigSettings />
      </div>
    </header>
  );
}
export default HeaderV0
