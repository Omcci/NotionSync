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

  // Check for token in Authorization header first, then query param
  const authHeader = req.headers.authorization
  let githubToken: string | undefined
  let isDeprecatedQueryToken = false

  if (authHeader && authHeader.startsWith('Bearer ')) {
    githubToken = authHeader.split(' ')[1]
  } else {
    githubToken = req.query.githubToken as string | undefined
    if (githubToken) {
      isDeprecatedQueryToken = true
    }
  }

  if (!githubToken || typeof githubToken !== 'string') {
    return res.status(401).json({ error: 'Authorization required' })
  }

  if (isDeprecatedQueryToken) {
    console.warn(
      'DEPRECATED: Using githubToken query parameter is deprecated. Use Authorization header instead.'
    )
  }

  try {
    const repos = await fetchUserRepos(githubToken)
    res.status(200).json({ repos })
  } catch (error: any) {
    // Handle specific GitHub errors
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'GitHubAuthError') {
        return res
          .status(401)
          .json({ error: 'Invalid or expired GitHub token' })
      }
      if (error.name === 'GitHubRateLimitError') {
        return res
          .status(429)
          .json({ error: error.message || 'Rate limit exceeded' })
      }
    }
    if (error instanceof Error) {
      if (
        error.message.includes('401') ||
        error.message.includes('Unauthorized')
      ) {
        return res
          .status(401)
          .json({ error: 'Invalid or expired GitHub token' })
      }
      if (error.message.includes('rate limit')) {
        return res.status(429).json({ error: error.message })
      }
    }
    res.status(500).json({ error: error?.message || 'Unknown error' })
  }
}
