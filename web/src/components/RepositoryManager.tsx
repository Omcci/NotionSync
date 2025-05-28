import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { useAppContext } from '@/context/AppContext'
import { useUser } from '@/context/UserContext'
import { useToast } from './ui/use-toast'
import { SyncRepo } from '../../types/types'
import {
  Plus,
  Trash2,
  Search,
  GitBranch,
  Lock,
  Unlock,
  RefreshCw,
  Settings,
  ExternalLink,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import { GitHubService } from '@/services/githubService'

const RepositoryManager: React.FC = () => {
  const [availableRepos, setAvailableRepos] = useState<SyncRepo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const { repos, setRepos } = useAppContext()
  const { githubToken } = useUser()
  const { toast } = useToast()

  const fetchAllRepositories = useCallback(async () => {
    setLoading(true)
    try {
      const repos = await GitHubService.getUserRepos(githubToken!)
      const transformedRepos: SyncRepo[] = repos.map((repo) => ({
        id: repo.id.toString(),
        name: repo.name,
        owner: repo.full_name.split('/')[0],
        description: repo.description || undefined,
        private: repo.private,
        language: repo.language || undefined,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        lastUpdated: repo.updated_at,
        syncEnabled: false,
      }))
      setAvailableRepos(transformedRepos)
    } catch (error) {
      console.error('Error fetching repositories:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch repositories',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [githubToken, toast])

  useEffect(() => {
    if (githubToken) {
      fetchAllRepositories()
    }
  }, [githubToken, fetchAllRepositories])

  const addRepository = (repo: SyncRepo) => {
    // Add repo with sync enabled
    const syncRepo: SyncRepo = {
      ...repo,
      syncEnabled: true,
    }
    const updatedRepos = [...repos, syncRepo]
    setRepos(updatedRepos)
    setAddDialogOpen(false)
    toast({
      title: 'Repository Added',
      description: `${repo.name} has been added to your sync list`,
    })
  }

  const removeRepository = (repoId: string) => {
    const updatedRepos = repos.filter((repo) => repo.id !== repoId)
    setRepos(updatedRepos)
    toast({
      title: 'Repository Removed',
      description: 'Repository has been removed from your sync list',
    })
  }

  const toggleSyncEnabled = (repoId: string) => {
    const updatedRepos = repos.map((repo) =>
      repo.id === repoId ? { ...repo, syncEnabled: !repo.syncEnabled } : repo,
    )
    setRepos(updatedRepos)
  }

  const filteredAvailableRepos = availableRepos.filter(
    (repo) =>
      !repos.some((syncedRepo) => syncedRepo.id === repo.id) &&
      (repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.owner.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Repository Management</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage which repositories are synced with Notion
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Repository
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Repository</DialogTitle>
              <DialogDescription>
                Select repositories from your GitHub account to sync with Notion
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {filteredAvailableRepos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm
                        ? 'No repositories found matching your search'
                        : 'All repositories are already added'}
                    </div>
                  ) : (
                    filteredAvailableRepos.map((repo) => (
                      <Card
                        key={repo.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">{repo.name}</h3>
                                {repo.private ? (
                                  <Lock className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <Unlock className="w-4 h-4 text-gray-500" />
                                )}
                                {repo.language && (
                                  <Badge variant="outline" className="text-xs">
                                    {repo.language}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {repo.owner}/{repo.name}
                              </p>
                              {repo.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {repo.description}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addRepository(repo)}
                            >
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Synced Repositories ({repos.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAllRepositories}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {repos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No repositories are currently being synced</p>
                <p className="text-sm">
                  Add repositories to start syncing with Notion
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {repos.map((repo) => (
                  <Card key={repo.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={repo.syncEnabled ?? true}
                              onCheckedChange={() => toggleSyncEnabled(repo.id)}
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">{repo.name}</h3>
                                {repo.private ? (
                                  <Lock className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <Unlock className="w-4 h-4 text-gray-500" />
                                )}
                                {repo.language && (
                                  <Badge variant="outline" className="text-xs">
                                    {repo.language}
                                  </Badge>
                                )}
                                <Badge
                                  variant={
                                    repo.syncEnabled ?? true
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {repo.syncEnabled ?? true
                                    ? 'Syncing'
                                    : 'Paused'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">
                                {repo.owner}/{repo.name}
                              </p>
                              {repo.lastSync && (
                                <p className="text-xs text-gray-400">
                                  Last sync:{' '}
                                  {new Date(repo.lastSync).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `https://github.com/${repo.owner}/${repo.name}`,
                                '_blank',
                              )
                            }
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>

                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Repository
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove &quot;
                                  {repo.name}&quot; from sync? This will stop
                                  syncing commits from this repository to
                                  Notion.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeRepository(repo.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RepositoryManager
