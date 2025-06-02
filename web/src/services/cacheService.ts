import { supabase } from '@/lib/supabaseClient'
import { RepositoryService } from './repositoryService'
import { CommitService } from './commitService'
import { GitHubService } from './githubService'
import { fetchCommitsForMultipleRepos, fetchCommitsWithPagination } from '@/pages/api/commits'
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

export interface PaginationResult {
    commits: Commit[]
    totalRepositories: number
    limitedRepositories: number
    repositoryDetails: Array<{
        repository: string
        commits: number
        limited: boolean
        oldestCommitDate?: string
        message: string
    }>
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

        console.log(`🗄️  CacheService: Checking commits for ${repositories.length} repositories`)
        console.log(`📅 Date range: ${startDate} to ${endDate}`)
        console.log(`⚙️  Cache config:`, finalConfig)

        try {
            // Check cached commits first
            const repoIds = repositories.map(r => r.id)
            const { commits: cachedCommits } = await CommitService.getCommits(
                userId,
                repoIds,
                startDate,
                endDate
            )

            console.log(`💾 Found ${cachedCommits.length} cached commits`)

            const now = new Date()
            const cacheThreshold = new Date(now.getTime() - finalConfig.commitCacheTime * 60 * 1000)

            console.log(`⏰ Cache threshold: ${cacheThreshold.toISOString()}`)

            // Check if we need to fetch from GitHub for any repository
            const reposNeedingUpdate: DatabaseRepository[] = []

            for (const repo of repositories) {
                const repoCommits = cachedCommits.filter(c => c.repoName === repo.name)
                const lastSync = repo.last_sync ? new Date(repo.last_sync) : new Date(0)

                console.log(`📂 Repository ${repo.name}:`)
                console.log(`  - Cached commits: ${repoCommits.length}`)
                console.log(`  - Last sync: ${lastSync.toISOString()}`)
                console.log(`  - Needs update: ${repoCommits.length === 0 || lastSync < cacheThreshold || finalConfig.forceRefresh}`)

                // Need update if:
                // 1. No cached commits for this repo in date range
                // 2. Last sync is older than cache threshold
                // 3. Force refresh is requested
                if (repoCommits.length === 0 || lastSync < cacheThreshold || finalConfig.forceRefresh) {
                    console.log(`  ✅ Adding ${repo.name} to update queue`)
                    reposNeedingUpdate.push(repo)
                } else {
                    console.log(`  ⏭️  Skipping ${repo.name} (cache is fresh)`)
                }
            }

            console.log(`🔄 Repositories needing update: ${reposNeedingUpdate.length}/${repositories.length}`)

            // If all repos have fresh cache, return cached data
            if (reposNeedingUpdate.length === 0 && !finalConfig.forceRefresh) {
                console.log(`✅ Returning cached data (${cachedCommits.length} commits)`)
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

            console.log(`🚀 Fetching fresh commits from GitHub for ${reposNeedingUpdate.length} repositories`)

            for (const repo of reposNeedingUpdate) {
                try {
                    console.log(`📡 Fetching commits for ${repo.owner}/${repo.name}`)

                    const commits = await fetchCommitsWithPagination(
                        githubToken,
                        [{ owner: repo.owner, name: repo.name }],
                        1000, // Default limit
                        startDate,
                        endDate
                    )

                    const repoCommits = commits.flatMap(result => result.commits)
                    console.log(`📥 Received ${repoCommits?.length || 0} commits for ${repo.name}`)

                    if (repoCommits && repoCommits.length > 0) {
                        // Store in database
                        console.log(`💾 Storing ${repoCommits.length} commits for ${repo.name}`)
                        await CommitService.storeCommits(repoCommits, userId, repo.id)
                        freshCommits.push(...repoCommits)
                        updatedRepoIds.push(repo.id)
                    }

                    // Update repository sync timestamp
                    await RepositoryService.updateSyncStatus(repo.id, true, new Date().toISOString())

                } catch (error) {
                    console.error(`❌ Failed to fetch commits for ${repo.owner}/${repo.name}:`, error)
                    // Continue with other repos
                }
            }

            console.log(`🎯 Fresh commits fetched: ${freshCommits.length}`)

            // Get updated commits from database (includes both cached and fresh)
            const { commits: allCommits } = await CommitService.getCommits(
                userId,
                repoIds,
                startDate,
                endDate
            )

            console.log(`📊 Final result: ${allCommits.length} total commits`)

            return {
                data: allCommits,
                source: reposNeedingUpdate.length > 0 ? 'github' : 'cache',
                lastUpdated: new Date().toISOString(),
                isFresh: true
            }

        } catch (error) {
            console.error('❌ Error in getCommits:', error)
            // Fallback to cached data
            const repoIds = repositories.map(r => r.id)
            const { commits: cachedCommits } = await CommitService.getCommits(
                userId,
                repoIds,
                startDate,
                endDate
            )

            console.log(`🆘 Fallback: returning ${cachedCommits.length} cached commits`)

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
     * Get commits with pagination support and UX feedback
     */
    static async getCommitsWithPagination(
        userId: string,
        repositories: DatabaseRepository[],
        githubToken: string,
        startDate: string,
        endDate: string,
        maxCommitsPerRepo: number = 1000,
        config: Partial<CacheConfig> = {}
    ): Promise<CacheResult<PaginationResult>> {
        const finalConfig = { ...this.defaultConfig, ...config }

        console.log(`🗄️  CacheService: Fetching commits with pagination`)
        console.log(`📅 Date range: ${startDate} to ${endDate}`)
        console.log(`🎯 Max commits per repo: ${maxCommitsPerRepo}`)
        console.log(`⚙️  Cache config:`, finalConfig)

        try {
            // Check cached commits first
            const repoIds = repositories.map(r => r.id)
            const { commits: cachedCommits } = await CommitService.getCommits(
                userId,
                repoIds,
                startDate,
                endDate
            )

            console.log(`💾 Found ${cachedCommits.length} cached commits`)

            const now = new Date()
            const cacheThreshold = new Date(now.getTime() - finalConfig.commitCacheTime * 60 * 1000)

            // Check if we need to fetch from GitHub
            const reposNeedingUpdate: DatabaseRepository[] = []

            for (const repo of repositories) {
                const repoCommits = cachedCommits.filter(c => c.repoName === repo.name)
                const lastSync = repo.last_sync ? new Date(repo.last_sync) : new Date(0)

                if (repoCommits.length === 0 || lastSync < cacheThreshold || finalConfig.forceRefresh) {
                    reposNeedingUpdate.push(repo)
                }
            }

            let allCommits = cachedCommits
            let repositoryDetails: PaginationResult['repositoryDetails'] = []
            let source: 'cache' | 'github' = 'cache'

            if (reposNeedingUpdate.length > 0 || finalConfig.forceRefresh) {
                console.log(`🚀 Fetching fresh commits from GitHub for ${reposNeedingUpdate.length} repositories`)
                source = 'github'

                // Fetch with pagination
                const paginationResults = await fetchCommitsWithPagination(
                    githubToken,
                    reposNeedingUpdate.map(repo => ({ owner: repo.owner, name: repo.name })),
                    maxCommitsPerRepo,
                    startDate,
                    endDate
                )

                // Store fresh commits and update repository details
                for (let i = 0; i < paginationResults.length; i++) {
                    const result = paginationResults[i]
                    const repo = reposNeedingUpdate[i]

                    if (result.commits.length > 0) {
                        try {
                            await CommitService.storeCommits(result.commits, userId, repo.id)
                            await RepositoryService.updateSyncStatus(repo.id, true, new Date().toISOString())
                        } catch (error) {
                            console.error(`❌ Failed to store commits for ${repo.name}:`, error)
                        }
                    }

                    repositoryDetails.push({
                        repository: result.pagination.repository,
                        commits: result.pagination.totalFetched,
                        limited: result.reachedLimit,
                        oldestCommitDate: result.pagination.oldestCommitDate,
                        message: result.message || `Fetched ${result.pagination.totalFetched} commits`
                    })
                }

                // Get updated commits from database
                const { commits: updatedCommits } = await CommitService.getCommits(
                    userId,
                    repoIds,
                    startDate,
                    endDate
                )
                allCommits = updatedCommits
            } else {
                // Use cached data and build repository details
                for (const repo of repositories) {
                    const repoCommits = cachedCommits.filter(c => c.repoName === repo.name)
                    repositoryDetails.push({
                        repository: `${repo.owner}/${repo.name}`,
                        commits: repoCommits.length,
                        limited: false,
                        message: `${repoCommits.length} commits (cached)`
                    })
                }
            }

            const limitedRepositories = repositoryDetails.filter(detail => detail.limited).length

            const result: PaginationResult = {
                commits: allCommits,
                totalRepositories: repositories.length,
                limitedRepositories,
                repositoryDetails
            }

            console.log(`📊 Pagination summary:`)
            console.log(`  - Total commits: ${allCommits.length}`)
            console.log(`  - Limited repositories: ${limitedRepositories}/${repositories.length}`)

            return {
                data: result,
                source,
                lastUpdated: new Date().toISOString(),
                isFresh: true
            }

        } catch (error) {
            console.error('❌ Error in getCommitsWithPagination:', error)

            // Fallback to cached data
            const repoIds = repositories.map(r => r.id)
            const { commits: cachedCommits } = await CommitService.getCommits(
                userId,
                repoIds,
                startDate,
                endDate
            )

            const repositoryDetails = repositories.map(repo => {
                const repoCommits = cachedCommits.filter(c => c.repoName === repo.name)
                return {
                    repository: `${repo.owner}/${repo.name}`,
                    commits: repoCommits.length,
                    limited: false,
                    message: `${repoCommits.length} commits (cached fallback)`
                }
            })

            return {
                data: {
                    commits: cachedCommits,
                    totalRepositories: repositories.length,
                    limitedRepositories: 0,
                    repositoryDetails
                },
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