import { NextApiRequest, NextApiResponse } from 'next'
import { CacheService } from '../../../services/cacheService'
import { getGitHubToken } from '../../../lib/auth'
import { validateSession } from '@/lib/session'
import { UserService } from '@/services/userService'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      userId,
      startDate,
      endDate,
      forceRefresh = 'false',
      repositoryCacheTime = '60',
      commitCacheTime = '30',
      maxCommitsPerRepo = '5000',
    } = req.query

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Missing required parameters: userId, startDate, endDate',
      })
    }

    // Try to get GitHub token from Authorization header first (client-side auth)
    const authHeader = req.headers.authorization
    let githubToken: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      githubToken = authHeader.split(' ')[1]
    } else {
      // Fallback: check server-side session and get token
      const sessionToken = req.headers.authorization?.replace('Bearer ', '')
      if (sessionToken) {
        try {
          const { user } = await validateSession(sessionToken)
          if (user) {
            if (user.id !== userId) {
              console.log('❌ User ID mismatch:', {
                sessionUserId: user.id,
                requestUserId: userId,
              })
              return res.status(403).json({
                message: 'User ID mismatch. Please re-authenticate.',
                authRequired: true,
                redirectTo: '/login',
              })
            }
            const storedToken = await UserService.getGitHubToken(user.id)
            if (storedToken) {
              githubToken = storedToken
            }
          }
        } catch (error) {
          console.error('❌ Session error:', error)
        }
      }

      if (!githubToken) {
        console.log('❌ No active session found')
        return res.status(401).json({
          message:
            'No active authentication session. Please log in with GitHub.',
          authRequired: true,
          redirectTo: '/login',
        })
      }
    }

    if (!githubToken) {
      return res.status(401).json({
        message: 'GitHub token not found',
        error:
          'No GitHub access token available. Please re-authenticate with GitHub.',
        authRequired: true,
        redirectTo: '/login',
      })
    }

    // Parse cache configuration
    const cacheConfig = {
      repositoryCacheTime: parseInt(repositoryCacheTime as string),
      commitCacheTime: parseInt(commitCacheTime as string),
      forceRefresh: forceRefresh === 'true',
    }

    // Get repositories with caching
    const repositoriesResult = await CacheService.getRepositories(
      userId as string,
      githubToken,
      { repositoryCacheTime: cacheConfig.repositoryCacheTime }
    )

    if (repositoriesResult.data.length === 0) {
      return res.status(200).json({
        commits: [],
        metadata: {
          repositories: repositoriesResult,
          commits: {
            source: 'none',
            count: 0,
            lastUpdated: new Date().toISOString(),
            isFresh: true,
          },
          pagination: {
            totalRepositories: 0,
            limitedRepositories: 0,
            totalCommits: 0,
          },
        },
        message:
          'No repositories found. Make sure you have access to repositories or try refreshing your GitHub connection.',
      })
    }

    // Get commits with smart caching and pagination
    const commitsResult = await CacheService.getCommitsWithPagination(
      userId as string,
      repositoriesResult.data,
      githubToken,
      startDate as string,
      endDate as string,
      parseInt(maxCommitsPerRepo as string),
      cacheConfig
    )

    return res.status(200).json({
      commits: commitsResult.data.commits,
      metadata: {
        repositories: repositoriesResult,
        commits: {
          source: commitsResult.source,
          count: commitsResult.data.commits.length,
          lastUpdated: commitsResult.lastUpdated,
          isFresh: commitsResult.isFresh,
        },
        pagination: {
          totalRepositories: commitsResult.data.totalRepositories,
          limitedRepositories: commitsResult.data.limitedRepositories,
          totalCommits: commitsResult.data.commits.length,
          repositoryDetails: commitsResult.data.repositoryDetails,
        },
      },
    })
  } catch (error) {
    console.error('❌ Smart cache error:', error)

    // Handle specific authentication errors
    if (error instanceof Error) {
      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('GitHub token')
      ) {
        return res.status(401).json({
          message: 'Authentication required',
          error: error.message,
          authRequired: true,
          redirectTo: '/login',
        })
      }

      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          message: 'GitHub API rate limit exceeded',
          error: error.message,
          retryAfter: 3600, // 1 hour
        })
      }
    }

    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
