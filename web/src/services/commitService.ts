import { supabase } from '@/lib/supabaseClient'
import { Commit } from '../../types/types'

export interface DatabaseCommit {
    id: string
    repo_id: string
    message: string
    author: string
    date: string
    sha?: string
    html_url?: string
    status?: string
    avatar_url?: string
    author_details?: any
    diff?: any
    actions?: any
    created_at?: string
    updated_at?: string
}

export interface CommitSyncResult {
    success: boolean
    newCommits: number
    totalCommits: number
    error?: string
}

export class CommitService {
    /**
     * Store commits in the database
     */
    static async storeCommits(
        commits: Commit[],
        userId: string,
        repoId: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const dbCommits: Omit<DatabaseCommit, 'id' | 'created_at' | 'updated_at'>[] = commits.map(commit => ({
                repo_id: repoId,
                message: commit.commit.message,
                author: commit.commit.author.name,
                date: commit.commit.author.date,
                sha: commit.sha,
                html_url: commit.html_url,
                status: commit.status || 'Unverified',
                avatar_url: commit.avatar_url || commit.committer?.avatar_url,
                author_details: commit.authorDetails ? JSON.stringify(commit.authorDetails) : null,
                diff: commit.diff ? JSON.stringify(commit.diff) : null,
                actions: commit.actions ? JSON.stringify(commit.actions) : null,
            }))

            const { error } = await supabase
                .from('commits')
                .upsert(dbCommits, {
                    onConflict: 'repo_id,sha',
                    ignoreDuplicates: false
                })

            if (error) {
                console.error('Error storing commits:', error)
                return { success: false, error: error.message }
            }

            return { success: true }
        } catch (error) {
            console.error('Error in storeCommits:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    /**
     * Fetch commits from database for a specific date range and repositories
     */
    static async getCommits(
        userId: string,
        repoIds: string[],
        startDate: string,
        endDate: string
    ): Promise<{ commits: Commit[]; error?: string }> {
        try {
            let query = supabase
                .from('commits')
                .select(`
          *,
          repositories!inner(
            id,
            name,
            owner,
            user_id
          )
        `)
                .eq('repositories.user_id', userId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false })

            if (repoIds.length > 0) {
                query = query.in('repo_id', repoIds)
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching commits:', error)
                return { commits: [], error: error.message }
            }

            // Transform database commits back to Commit format
            const commits: Commit[] = (data || []).map(dbCommit => ({
                sha: dbCommit.sha || '',
                html_url: dbCommit.html_url || '',
                commit: {
                    message: dbCommit.message,
                    author: {
                        name: dbCommit.author,
                        date: dbCommit.date,
                    },
                    verification: {
                        verified: dbCommit.status === 'Verified'
                    },
                    tree: {
                        sha: '' // Not stored in DB, but required by type
                    }
                },
                author: dbCommit.author_details ? JSON.parse(dbCommit.author_details) : null,
                committer: null,
                repoName: dbCommit.repositories?.name || '',
                date: dbCommit.date,
                status: dbCommit.status || 'Unverified',
                authorDetails: dbCommit.author_details ? JSON.parse(dbCommit.author_details) : null,
                avatar_url: dbCommit.avatar_url,
                actions: dbCommit.actions ? JSON.parse(dbCommit.actions) : [],
                diff: dbCommit.diff ? JSON.parse(dbCommit.diff) : []
            }))

            return { commits }
        } catch (error) {
            console.error('Error in getCommits:', error)
            return { commits: [], error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    /**
     * Get commits count for a repository
     */
    static async getCommitsCount(repoId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('commits')
                .select('*', { count: 'exact', head: true })
                .eq('repo_id', repoId)

            if (error) {
                console.error('Error getting commits count:', error)
                return 0
            }

            return count || 0
        } catch (error) {
            console.error('Error in getCommitsCount:', error)
            return 0
        }
    }

    /**
     * Get latest commit date for a repository
     */
    static async getLatestCommitDate(repoId: string): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from('commits')
                .select('date')
                .eq('repo_id', repoId)
                .order('date', { ascending: false })
                .limit(1)

            if (error) {
                console.error('Error getting latest commit date:', error)
                return null
            }

            return data?.[0]?.date || null
        } catch (error) {
            console.error('Error in getLatestCommitDate:', error)
            return null
        }
    }

    /**
     * Delete commits for a repository
     */
    static async deleteCommitsForRepo(repoId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('commits')
                .delete()
                .eq('repo_id', repoId)

            if (error) {
                console.error('Error deleting commits:', error)
                return { success: false, error: error.message }
            }

            return { success: true }
        } catch (error) {
            console.error('Error in deleteCommitsForRepo:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }

    /**
     * Sync commits for repositories (fetch from GitHub and store in DB)
     */
    static async syncCommitsForRepos(
        userId: string,
        repos: Array<{ id: string; name: string; owner: string }>,
        githubToken: string,
        startDate?: string,
        endDate?: string
    ): Promise<CommitSyncResult> {
        try {
            // Call the sync endpoint with all repositories at once
            const response = await fetch('/api/commits/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${githubToken}`
                },
                body: JSON.stringify({
                    repos: repos.map(repo => ({
                        id: repo.id,
                        owner: repo.owner,
                        name: repo.name
                    })),
                    startDate,
                    endDate,
                    userId
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to sync commits')
            }

            const result = await response.json()

            return {
                success: result.success,
                newCommits: result.newCommits || 0,
                totalCommits: result.totalCommits || 0,
                error: result.success ? undefined : result.error
            }
        } catch (error) {
            console.error('Error in syncCommitsForRepos:', error)
            return {
                success: false,
                newCommits: 0,
                totalCommits: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
} 