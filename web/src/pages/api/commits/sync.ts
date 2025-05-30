import { NextApiRequest, NextApiResponse } from 'next'
import { CommitService } from '@/services/commitService'
import { RepositoryService } from '@/services/repositoryService'
import { fetchCommitsForMultipleRepos } from '../commits'

interface SyncRequest {
    repos: Array<{
        id?: string
        owner: string
        name: string
        description?: string
        private?: boolean
        language?: string
        url?: string
        stars?: number
        forks?: number
        lastUpdated?: string
    }>
    startDate?: string
    endDate?: string
    userId: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const githubToken = authHeader.split(' ')[1]
    const { repos, startDate, endDate, userId }: SyncRequest = req.body

    if (!repos || !Array.isArray(repos) || repos.length === 0) {
        return res.status(400).json({ message: 'Invalid repos parameter' })
    }

    if (!userId) {
        return res.status(400).json({ message: 'Missing userId' })
    }

    try {
        let totalNewCommits = 0
        let totalCommits = 0
        const syncResults: Array<{ repo: string; success: boolean; commits: number; error?: string }> = []

        // First, ensure all repositories exist in the database
        const repositoriesToSync = repos.map(repo => ({
            id: repo.id || `${repo.owner}/${repo.name}`,
            name: repo.name,
            owner: repo.owner,
            description: repo.description,
            private: repo.private || false,
            language: repo.language,
            url: repo.url || `https://github.com/${repo.owner}/${repo.name}`,
            stars: repo.stars || 0,
            forks: repo.forks || 0,
            lastUpdated: repo.lastUpdated || new Date().toISOString()
        }))

        const repoSyncResult = await RepositoryService.syncRepositoriesFromGitHub(
            userId,
            repositoriesToSync
        )

        if (!repoSyncResult.success) {
            return res.status(500).json({
                success: false,
                error: repoSyncResult.error,
                message: 'Failed to sync repositories to database'
            })
        }

        const dbRepositories = repoSyncResult.repositories || []

        // Now sync commits for each repository
        for (const repo of repos) {
            try {
                // Find the database repository ID
                const dbRepo = dbRepositories.find(r => r.name === repo.name && r.owner === repo.owner)
                if (!dbRepo) {
                    syncResults.push({
                        repo: `${repo.owner}/${repo.name}`,
                        success: false,
                        commits: 0,
                        error: 'Repository not found in database'
                    })
                    continue
                }

                // Fetch commits from GitHub API for this specific repo
                const commits = await fetchCommitsForMultipleRepos(
                    githubToken,
                    [{ owner: repo.owner, name: repo.name }],
                    startDate,
                    endDate
                )

                if (!commits || commits.length === 0) {
                    syncResults.push({
                        repo: `${repo.owner}/${repo.name}`,
                        success: true,
                        commits: 0
                    })
                    continue
                }

                // Store commits in database
                const storeResult = await CommitService.storeCommits(commits, userId, dbRepo.id)

                if (!storeResult.success) {
                    syncResults.push({
                        repo: `${repo.owner}/${repo.name}`,
                        success: false,
                        commits: 0,
                        error: storeResult.error
                    })
                    continue
                }

                totalNewCommits += commits.length
                const repoTotalCommits = await CommitService.getCommitsCount(dbRepo.id)
                totalCommits += repoTotalCommits

                syncResults.push({
                    repo: `${repo.owner}/${repo.name}`,
                    success: true,
                    commits: commits.length
                })

                // Update repository last sync time
                await RepositoryService.updateSyncStatus(dbRepo.id, true, new Date().toISOString())

            } catch (error) {
                console.error(`Error syncing commits for ${repo.owner}/${repo.name}:`, error)
                syncResults.push({
                    repo: `${repo.owner}/${repo.name}`,
                    success: false,
                    commits: 0,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        const successfulSyncs = syncResults.filter(r => r.success).length
        const failedSyncs = syncResults.filter(r => !r.success).length

        res.status(200).json({
            success: true,
            newCommits: totalNewCommits,
            totalCommits,
            repositoriesProcessed: repos.length,
            successfulSyncs,
            failedSyncs,
            results: syncResults,
            message: `Successfully synced ${successfulSyncs}/${repos.length} repositories with ${totalNewCommits} new commits`
        })

    } catch (error) {
        console.error('Error in commit sync:', error)
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to sync commits'
        })
    }
} 