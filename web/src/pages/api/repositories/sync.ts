import { NextApiRequest, NextApiResponse } from 'next'
import { RepositoryService } from '@/services/repositoryService'
import { GitHubService } from '@/services/githubService'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const githubToken = authHeader.split(' ')[1]
  const { userId, repos } = req.body

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' })
  }

  try {
    let repositoriesToSync: Array<{
      id: string
      name: string
      owner: string
      description?: string
      private: boolean
      language?: string
      url: string
      stars: number
      forks: number
      lastUpdated: string
    }> = []

    if (repos && Array.isArray(repos)) {
      // Sync specific repositories provided in the request
      repositoriesToSync = repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        owner: repo.owner,
        description: repo.description,
        private: repo.private || false,
        language: repo.language,
        url: repo.url || `https://github.com/${repo.owner}/${repo.name}`,
        stars: repo.stars || 0,
        forks: repo.forks || 0,
        lastUpdated: repo.lastUpdated || new Date().toISOString(),
      }))
    } else {
      // Fetch all repositories from GitHub and sync them
      const githubRepos = await GitHubService.getUserRepos(githubToken)
      repositoriesToSync = githubRepos.map((repo) => ({
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
      }))
    }

    // Sync repositories to database
    const result = await RepositoryService.syncRepositoriesFromGitHub(
      userId,
      repositoriesToSync,
    )

    if (!result.success) {
      return res.status(500).json({
        message: 'Failed to sync repositories',
        error: result.error,
      })
    }

    res.status(200).json({
      success: true,
      message: `Successfully synced ${repositoriesToSync.length} repositories`,
      repositories: result.repositories,
      count: repositoriesToSync.length,
    })
  } catch (error) {
    console.error('Error syncing repositories:', error)
    res.status(500).json({
      message: 'Failed to sync repositories',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
