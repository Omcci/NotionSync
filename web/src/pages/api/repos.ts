import type { NextApiRequest, NextApiResponse } from 'next'
import { ReposResponse } from '../../../types/types'
import { GitHubService } from '@/services/githubService'

export const fetchUserRepos = async (githubToken: string) => {
  try {
    const repos = await GitHubService.getUserRepos(githubToken)
    return repos.map(repo => ({
      id: repo.id.toString(),
      name: repo.name,
      owner: repo.full_name.split('/')[0],
    }))
  } catch (error) {
    console.error('Error in fetchUserRepos:', error)
    throw error
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReposResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // SECURITY FIX: Get token from Authorization header instead of query params
  // This prevents token exposure in URLs, logs, and browser history
  const authHeader = req.headers.authorization
  let githubToken: string | undefined

  if (authHeader?.startsWith('Bearer ')) {
    githubToken = authHeader.substring(7)
  } else {
    // Fallback to query param for backward compatibility (deprecated)
    const queryToken = req.query.githubToken
    if (queryToken && typeof queryToken === 'string') {
      console.warn(
        'DEPRECATED: GitHub token passed as query parameter. Use Authorization header instead.'
      )
      githubToken = queryToken
    }
  }

  if (!githubToken) {
    return res
      .status(401)
      .json({
        error:
          'Authorization required. Provide GitHub token in Authorization header.',
      })
  }

  try {
    const repos = await fetchUserRepos(githubToken)
    res.status(200).json({ repos })
  } catch (error: any) {
    console.error('Error in repos API handler:', error.message)

    // Handle specific GitHub errors
    if (
      error.message?.includes('401') ||
      error.message?.includes('Bad credentials')
    ) {
      return res.status(401).json({ error: 'Invalid or expired GitHub token' })
    }
    if (error.rateLimited) {
      return res.status(429).json({ error: 'GitHub API rate limit exceeded' })
    }

    res.status(500).json({ error: error.message })
  }
}
