import { supabase } from '@/lib/supabaseClient'
import { RepositoryService } from './repositoryService'
import { CommitService } from './commitService'
import { GitHubService } from './githubService'
import { fetchCommitsForMultipleRepos } from '@/pages/api/commits'
import { Commit } from '../../types/types'
import { DatabaseRepository } from '../../types/repository'

export interface CacheConfig {
    // How long to consider repository data fresh (in minutes)
    repositoryCacheTime: number
    // How long to consider commit data fresh (in minutes)
    commitCacheTime: number
    // Force refresh from GitHub API
    forceRefresh?: boolean
}

export interface CacheResult<T> {
    data: T
    source: 'cache' | 'github'
    lastUpdated: string
    isFresh: boolean
}

export class CacheService {
    private static defaultConfig: CacheConfig = {
        repositoryCacheTime: 60, // 1 hour for repositories
        commitCacheTime: 30, // 30 minutes for commits
        forceRefresh: false
    }

    /**
     * Get repositories with intelligent caching
     */
    static async getRepositories(
        userId: string,
        githubToken: string,
        config: Partial<CacheConfig> = {}
    ): Promise<CacheResult<DatabaseRepository[]>> {
        const finalConfig = { ...this.defaultConfig, ...config }

        try {
            // First, check if we have cached repositories
            const { repositories: cachedRepos } = await RepositoryService.getUserRepositories(userId)

            const now = new Date()
            const cacheThreshold = new Date(now.getTime() - finalConfig.repositoryCacheTime * 60 * 1000)

            // Check if cached data is fresh enough
            const hasFreshCache = cachedRepos.length > 0 &&
                cachedRepos.some(repo => new Date(repo.updated_at) > cacheThreshold)

            if (hasFreshCache && !finalConfig.forceRefresh) {
                return {
                    data: cachedRepos,
                    source: 'cache',
                    lastUpdated: Math.max(...cachedRepos.map(r => new Date(r.updated_at).getTime())).toString(),
                    isFresh: true
                }
            }

            // Fetch fresh data from GitHub
            const githubRepos = await GitHubService.getUserRepos(githubToken)
            const transformedRepos = githubRepos.map(repo => ({
                id: repo.id.toString(),
                name: repo.name,
                owner: repo.full_name.split('/')[0],
                description: repo.description || undefined,
                private: repo.private,
                language: repo.language || undefined,
                url: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                lastUpdated: repo.updated_at
            }))

            // Update cache
            const syncResult = await RepositoryService.syncRepositoriesFromGitHub(userId, transformedRepos)

            return {
                data: syncResult.repositories || [],
                source: 'github',
                lastUpdated: new Date().toISOString(),
                isFresh: true
            }

        } catch (error) {
            console.error('Error in getRepositories:', error)
            // Fallback to cached data if GitHub fails
            const { repositories: cachedRepos } = await RepositoryService.getUserRepositories(userId)
            return {
                data: cachedRepos,
                source: 'cache',
                lastUpdated: cachedRepos.length > 0 ?
                    Math.max(...cachedRepos.map(r => new Date(r.updated_at).getTime())).toString() :
                    new Date().toISOString(),
                isFresh: false
            }
        }
    }

    /**
     * Get commits with intelligent caching
     */
    static async getCommits(
        userId: string,
        repositories: DatabaseRepository[],
        githubToken: string,
        startDate: string,
        endDate: string,
        config: Partial<CacheConfig> = {}
    ): Promise<CacheResult<Commit[]>> {
        const finalConfig = { ...this.defaultConfig, ...config }

        try {
            // Check cached commits first
            const repoIds = repositories.map(r => r.id)
            const { commits: cachedCommits } = await CommitService.getCommits(
                userId,
                repoIds,
                startDate,
                endDate
            )

            const now = new Date()
            const cacheThreshold = new Date(now.getTime() - finalConfig.commitCacheTime * 60 * 1000)

            // Check if we need to fetch from GitHub for any repository
            const reposNeedingUpdate: DatabaseRepository[] = []

            for (const repo of repositories) {
                const repoCommits = cachedCommits.filter(c => c.repoName === repo.name)
                const lastSync = repo.last_sync ? new Date(repo.last_sync) : new Date(0)

                // Need update if:
                // 1. No cached commits for this repo in date range
                // 2. Last sync is older than cache threshold
                // 3. Force refresh is requested
                if (repoCommits.length === 0 || lastSync < cacheThreshold || finalConfig.forceRefresh) {
                    reposNeedingUpdate.push(repo)
                }
            }

            // If all repos have fresh cache, return cached data
            if (reposNeedingUpdate.length === 0 && !finalConfig.forceRefresh) {
                return {
                    data: cachedCommits,
                    source: 'cache',
                    lastUpdated: repositories.length > 0 ?
                        Math.max(...repositories.map(r => new Date(r.last_sync || 0).getTime())).toString() :
                        new Date().toISOString(),
                    isFresh: true
                }
            }

            // Fetch fresh commits from GitHub for repos that need updating
            const freshCommits: Commit[] = []
            const updatedRepoIds: string[] = []

            for (const repo of reposNeedingUpdate) {
                try {
                    const commits = await fetchCommitsForMultipleRepos(
                        githubToken,
                        [{ owner: repo.owner, name: repo.name }],
                        startDate,
                        endDate
                    )

                    if (commits && commits.length > 0) {
                        // Store in database
                        await CommitService.storeCommits(commits, userId, repo.id)
                        freshCommits.push(...commits)
                        updatedRepoIds.push(repo.id)
                    }

                    // Update repository sync timestamp
                    await RepositoryService.updateSyncStatus(repo.id, true, new Date().toISOString())

                } catch (error) {
                    console.error(`Failed to fetch commits for ${repo.owner}/${repo.name}:`, error)
                    // Continue with other repos
                }
            }

            // Get updated commits from database (includes both cached and fresh)
            const { commits: allCommits } = await CommitService.getCommits(
                userId,
                repoIds,
                startDate,
                endDate
            )

            return {
                data: allCommits,
                source: reposNeedingUpdate.length > 0 ? 'github' : 'cache',
                lastUpdated: new Date().toISOString(),
                isFresh: true
            }

        } catch (error) {
            console.error('Error in getCommits:', error)
            // Fallback to cached data
            const repoIds = repositories.map(r => r.id)
            const { commits: cachedCommits } = await CommitService.getCommits(
                userId,
                repoIds,
                startDate,
                endDate
            )

            return {
                data: cachedCommits,
                source: 'cache',
                lastUpdated: repositories.length > 0 ?
                    Math.max(...repositories.map(r => new Date(r.last_sync || 0).getTime())).toString() :
                    new Date().toISOString(),
                isFresh: false
            }
        }
    }

    /**
     * Force refresh all data from GitHub
     */
    static async forceRefresh(
        userId: string,
        githubToken: string,
        startDate: string,
        endDate: string
    ): Promise<{ repositories: CacheResult<DatabaseRepository[]>; commits: CacheResult<Commit[]> }> {
        // Force refresh repositories
        const repositories = await this.getRepositories(userId, githubToken, { forceRefresh: true })

        // Force refresh commits
        const commits = await this.getCommits(
            userId,
            repositories.data,
            githubToken,
            startDate,
            endDate,
            { forceRefresh: true }
        )

        return { repositories, commits }
    }

    /**
     * Get cache statistics
     */
    static async getCacheStats(userId: string): Promise<{
        repositoryCount: number
        commitCount: number
        lastRepositorySync: string | null
        lastCommitSync: string | null
        cacheSize: string
    }> {
        try {
            const { repositories } = await RepositoryService.getUserRepositories(userId)

            let totalCommits = 0
            let lastCommitSync: string | null = null

            for (const repo of repositories) {
                const count = await CommitService.getCommitsCount(repo.id)
                totalCommits += count

                if (repo.last_sync) {
                    if (!lastCommitSync || new Date(repo.last_sync) > new Date(lastCommitSync)) {
                        lastCommitSync = repo.last_sync
                    }
                }
            }

            const lastRepositorySync = repositories.length > 0 ?
                Math.max(...repositories.map(r => new Date(r.updated_at).getTime())).toString() :
                null

            // Rough cache size estimation (in MB)
            const estimatedSize = ((repositories.length * 1) + (totalCommits * 2)) / 1024 // KB to MB approximation

            return {
                repositoryCount: repositories.length,
                commitCount: totalCommits,
                lastRepositorySync,
                lastCommitSync,
                cacheSize: `${estimatedSize.toFixed(2)} MB`
            }

        } catch (error) {
            console.error('Error getting cache stats:', error)
            return {
                repositoryCount: 0,
                commitCount: 0,
                lastRepositorySync: null,
                lastCommitSync: null,
                cacheSize: '0 MB'
            }
        }
    }
} 