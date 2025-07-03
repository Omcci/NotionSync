import { NextApiRequest, NextApiResponse } from 'next'
import { CommitService } from '@/services/commitService'
import { RepositoryService } from '@/services/repositoryService'
import { fetchCommitsForMultipleRepos } from '../commits'

interface DatabaseRequest {
    userId: string
    startDate?: string
    endDate?: string
    sync?: boolean
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Unauthorized',
            authRequired: true,
            error: 'Missing or invalid authorization header'
        })
    }

    const githubToken = authHeader.split(' ')[1]
    const { userId, startDate, endDate, sync } = req.query as DatabaseRequest

    if (!userId) {
        return res.status(400).json({ message: 'Missing userId parameter' })
    }

    try {
        console.log(`🗄️ Database API called:`, {
            userId,
            startDate,
            endDate,
            sync: sync === 'true',
            hasToken: !!githubToken
        })

        // Get user's repositories
        const { repositories, error: repoError } = await RepositoryService.getUserRepositories(userId)

        if (repoError) {
            console.error('Error fetching repositories:', repoError)
            return res.status(500).json({
                success: false,
                error: repoError,
                message: 'Failed to fetch user repositories'
            })
        }

        if (!repositories || repositories.length === 0) {
            return res.status(200).json({
                success: true,
                commits: [],
                metadata: {
                    count: 0,
                    source: 'database',
                    lastUpdated: new Date().toISOString(),
                    repositories: [],
                    message: 'No repositories found for user'
                }
            })
        }

        const repoIds = repositories.map(repo => repo.id)
        console.log(`📂 Found ${repositories.length} repositories for user:`, repositories.map(r => r.name))

        // If sync is requested, fetch fresh data from GitHub
        if (sync === 'true' && githubToken) {
            console.log(`🔄 Sync requested - fetching fresh data from GitHub`)

            try {
                const githubRepos = repositories.map(repo => ({
                    owner: repo.owner,
                    name: repo.name
                }))

                const freshCommits = await fetchCommitsForMultipleRepos(
                    githubToken,
                    githubRepos,
                    startDate,
                    endDate
                )

                if (freshCommits && freshCommits.length > 0) {
                    console.log(`📥 Fetched ${freshCommits.length} commits from GitHub`)

                    // Store commits in database
                    for (const repo of repositories) {
                        const repoCommits = freshCommits.filter(commit =>
                            commit.repoName === repo.name
                        )

                        if (repoCommits.length > 0) {
                            const storeResult = await CommitService.storeCommits(
                                repoCommits,
                                userId,
                                repo.id
                            )

                            if (!storeResult.success) {
                                console.error(`Error storing commits for ${repo.name}:`, storeResult.error)
                            } else {
                                console.log(`✅ Stored ${repoCommits.length} commits for ${repo.name}`)
                            }
                        }
                    }
                }
            } catch (syncError) {
                console.error('Error during sync:', syncError)
                // Continue with database fetch even if sync fails
            }
        }

        // Fetch commits from database
        const { commits, error: commitError } = await CommitService.getCommits(
            userId,
            repoIds,
            startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 year ago
            endDate || new Date().toISOString()
        )

        if (commitError) {
            console.error('Error fetching commits from database:', commitError)
            return res.status(500).json({
                success: false,
                error: commitError,
                message: 'Failed to fetch commits from database'
            })
        }

        // Get metadata
        const totalCommits = commits.length
        const lastUpdated = new Date().toISOString()

        // Get commit counts per repository
        const repoStats = await Promise.all(
            repositories.map(async (repo) => {
                const count = await CommitService.getCommitsCount(repo.id)
                const latestDate = await CommitService.getLatestCommitDate(repo.id)
                return {
                    id: repo.id,
                    name: repo.name,
                    owner: repo.owner,
                    commitCount: count,
                    latestCommitDate: latestDate
                }
            })
        )

        console.log(`✅ Successfully fetched ${totalCommits} commits from database`)
        console.log(`📊 Repository stats:`, repoStats)

        res.status(200).json({
            success: true,
            commits,
            metadata: {
                count: totalCommits,
                source: sync === 'true' ? 'github_sync' : 'database',
                lastUpdated,
                repositories: repoStats,
                dateRange: {
                    startDate: startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                    endDate: endDate || new Date().toISOString()
                }
            }
        })

    } catch (error) {
        console.error('Error in database API:', error)
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to fetch commits from database'
        })
    }
} 