import { NextApiRequest, NextApiResponse } from 'next'
import { CacheService } from '@/services/cacheService'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const githubToken = authHeader.split(' ')[1]
    const { userId, startDate, endDate, forceRefresh, repositoryCacheTime, commitCacheTime } = req.query as {
        userId: string
        startDate: string
        endDate: string
        forceRefresh?: string
        repositoryCacheTime?: string
        commitCacheTime?: string
    }

    if (!userId || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required parameters: userId, startDate, endDate' })
    }

    try {
        // Parse cache configuration
        const cacheConfig = {
            forceRefresh: forceRefresh === 'true',
            repositoryCacheTime: repositoryCacheTime ? parseInt(repositoryCacheTime) : undefined,
            commitCacheTime: commitCacheTime ? parseInt(commitCacheTime) : undefined,
        }

        // Get repositories with intelligent caching
        const repositoriesResult = await CacheService.getRepositories(
            userId,
            githubToken,
            cacheConfig
        )

        // Get commits with intelligent caching
        const commitsResult = await CacheService.getCommits(
            userId,
            repositoriesResult.data,
            githubToken,
            startDate,
            endDate,
            cacheConfig
        )

        // Get cache statistics
        const cacheStats = await CacheService.getCacheStats(userId)

        res.status(200).json({
            commits: commitsResult.data,
            repositories: repositoriesResult.data,
            metadata: {
                commits: {
                    source: commitsResult.source,
                    lastUpdated: commitsResult.lastUpdated,
                    isFresh: commitsResult.isFresh,
                    count: commitsResult.data.length
                },
                repositories: {
                    source: repositoriesResult.source,
                    lastUpdated: repositoriesResult.lastUpdated,
                    isFresh: repositoriesResult.isFresh,
                    count: repositoriesResult.data.length
                },
                cache: cacheStats,
                performance: {
                    usedCache: commitsResult.source === 'cache',
                    cacheHitRatio: commitsResult.source === 'cache' ? 1 : 0,
                    message: commitsResult.source === 'cache'
                        ? 'Data served from cache for optimal performance'
                        : 'Data fetched from GitHub API and cached for future requests'
                }
            }
        })

    } catch (error) {
        console.error('Error in smart cache commits:', error)
        res.status(500).json({
            message: 'Failed to fetch commits',
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
} 