import type { NextApiRequest, NextApiResponse } from 'next'
import { GitHubService } from '@/services/githubService'
import { GitHubRepo } from '../../../../types/github'
import { Repository, AllReposResponse } from '../../../../types/repository'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AllReposResponse | { message: string; error?: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const githubToken = authHeader.split(' ')[1]

  try {
    // Fetch all repositories with pagination using GitHubService
    let allRepos: GitHubRepo[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const repos = await GitHubService.getUserRepos(githubToken, page, perPage)

      if (repos.length === 0) {
        break
      }

      allRepos = [...allRepos, ...repos]

      // If we got less than perPage results, we've reached the end
      if (repos.length < perPage) {
        break
      }

      page++
    }

    // Transform the data
    const transformedRepos: Repository[] = allRepos.map((repo) => ({
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

    // Sort by last updated (most recent first)
    transformedRepos.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    )

    res.status(200).json({
      repos: transformedRepos,
      total: transformedRepos.length,
    })
  } catch (error) {
    console.error('Error fetching all repositories:', error)
    res.status(500).json({
      message: 'Failed to fetch repositories',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
