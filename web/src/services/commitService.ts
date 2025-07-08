import { supabase } from '@/lib/supabaseClient'
import { Commit } from '../../types/types'
import { fetchCommitsWithTimePagination } from '../pages/api/commits'

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
    repoId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const dbCommits: Omit<
        DatabaseCommit,
        'id' | 'created_at' | 'updated_at'
      >[] = commits.map((commit) => ({
        repo_id: repoId,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        sha: commit.sha,
        html_url: commit.html_url,
        status: commit.status || 'Unverified',
        avatar_url: commit.avatar_url || commit.committer?.avatar_url,
        author_details: commit.authorDetails
          ? JSON.stringify(commit.authorDetails)
          : null,
        diff: commit.diff ? JSON.stringify(commit.diff) : null,
        actions: commit.actions ? JSON.stringify(commit.actions) : null,
      }))

      const { error } = await supabase.from('commits').upsert(dbCommits, {
        onConflict: 'repo_id,sha',
        ignoreDuplicates: false,
      })

      if (error) {
        console.error('Error storing commits:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in storeCommits:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Fetch commits from database for a specific date range and repositories
   */
  static async getCommits(
    userId: string,
    repoIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<{ commits: Commit[]; error?: string }> {
    try {
      // Normalize dates to ensure proper comparison
      const normalizedStartDate = new Date(startDate).toISOString()
      const normalizedEndDate = new Date(endDate).toISOString()

      // Use a more explicit date range query to ensure proper filtering
      // Supabase has a default limit of 1000, so we need to handle pagination
      let allCommits: any[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      console.log(
        `🔍 Fetching commits with pagination for date range: ${normalizedStartDate} to ${normalizedEndDate}`,
      )

      while (hasMore) {
        console.log(
          `📄 Fetching page ${page + 1} (${page * pageSize} to ${(page + 1) * pageSize - 1})`,
        )
        let query = supabase
          .from('commits')
          .select(
            `
              *,
              repositories!inner(
                id,
                name,
                owner,
                user_id
              )
            `,
          )
          .eq('repositories.user_id', userId)
          .gte('date', normalizedStartDate)
          .lte('date', normalizedEndDate)
          .order('date', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (repoIds.length > 0) {
          query = query.in('repo_id', repoIds)
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching commits:', error)
          return { commits: [], error: error.message }
        }

        if (!data || data.length === 0) {
          console.log(`✅ No more data on page ${page + 1}`)
          hasMore = false
        } else {
          console.log(`📦 Received ${data.length} commits on page ${page + 1}`)
          allCommits.push(...data)
          hasMore = data.length === pageSize
          page++
        }

        // Safety check to prevent infinite loops
        if (page > 50) {
          console.warn('Stopped pagination after 50 pages (safety limit)')
          break
        }
      }

      console.log(`📊 Total commits fetched: ${allCommits.length}`)

      // Additional client-side filtering as a safety measure
      let filteredData = allCommits
      if (filteredData.length > 0) {
        filteredData = filteredData.filter((commit: any) => {
          const commitDate = new Date(commit.date)
          const start = new Date(normalizedStartDate)
          const end = new Date(normalizedEndDate)
          return commitDate >= start && commitDate <= end
        })
      }

      console.log(`✅ Final filtered commits: ${filteredData.length}`)

      // Transform database commits back to Commit format
      const commits: Commit[] = filteredData.map((dbCommit: any) => ({
        sha: dbCommit.sha || '',
        html_url: dbCommit.html_url || '',
        commit: {
          message: dbCommit.message,
          author: {
            name: dbCommit.author,
            date: dbCommit.date,
          },
          verification: {
            verified: dbCommit.status === 'Verified',
          },
          tree: {
            sha: '', // Not stored in DB, but required by type
          },
        },
        author: dbCommit.author_details
          ? JSON.parse(dbCommit.author_details)
          : null,
        committer: null,
        repoName: dbCommit.repositories?.name || '',
        date: dbCommit.date,
        status: dbCommit.status || 'Unverified',
        authorDetails: dbCommit.author_details
          ? JSON.parse(dbCommit.author_details)
          : null,
        avatar_url: dbCommit.avatar_url,
        actions: dbCommit.actions ? JSON.parse(dbCommit.actions) : [],
        diff: dbCommit.diff ? JSON.parse(dbCommit.diff) : [],
      }))

      return { commits }
    } catch (error) {
      console.error('Error in getCommits:', error)
      return {
        commits: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
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
  static async deleteCommitsForRepo(
    repoId: string,
  ): Promise<{ success: boolean; error?: string }> {
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
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Sync commits for repositories using intelligent time-based pagination
   */
  static async syncCommitsWithTimePagination(
    userId: string,
    repos: Array<{ id: string; name: string; owner: string }>,
    githubToken: string,
    monthsBack: number = 12,
  ): Promise<CommitSyncResult> {
    try {
      // Call the function directly instead of making an HTTP request
      const { results, timeWindows } = await fetchCommitsWithTimePagination(
        githubToken,
        repos.map((repo) => ({ owner: repo.owner, name: repo.name })),
        monthsBack,
        5000, // maxCommitsPerRepo - increased for better coverage
      )

      // Store commits in database
      let totalNewCommits = 0
      for (const repoResult of results) {
        const repo = repos.find(
          (r) => `${r.owner}/${r.name}` === repoResult.pagination.repository,
        )
        if (repo && repoResult.commits.length > 0) {
          const storeResult = await this.storeCommits(
            repoResult.commits,
            userId,
            repo.id,
          )
          if (storeResult.success) {
            totalNewCommits += repoResult.commits.length
          }
        }
      }

      return {
        success: true,
        newCommits: totalNewCommits,
        totalCommits: results.reduce(
          (sum, result) => sum + result.commits.length,
          0,
        ),
        error: undefined,
      }
    } catch (error) {
      console.error('Error in syncCommitsWithTimePagination:', error)
      return {
        success: false,
        newCommits: 0,
        totalCommits: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
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
    endDate?: string,
  ): Promise<CommitSyncResult> {
    try {
      // Call the sync endpoint with all repositories at once
      const response = await fetch('/api/commits/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${githubToken}`,
        },
        body: JSON.stringify({
          repos: repos.map((repo) => ({
            id: repo.id,
            owner: repo.owner,
            name: repo.name,
          })),
          startDate,
          endDate,
          userId,
        }),
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
        error: result.success ? undefined : result.error,
      }
    } catch (error) {
      console.error('Error in syncCommitsForRepos:', error)
      return {
        success: false,
        newCommits: 0,
        totalCommits: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Backfill older commits by fetching from GitHub starting from the oldest commit in database
   */
  static async backfillOlderCommits(
    userId: string,
    repos: Array<{ id: string; name: string; owner: string }>,
    githubToken: string,
    requestedStartDate?: string,
  ): Promise<CommitSyncResult> {
    try {
      console.log(
        `🔍 Starting backfill process for ${repos.length} repositories`,
      )

      let totalNewCommits = 0
      let totalFetchedCommits = 0
      const repoIds = repos.map((repo) => repo.id)

      // For each repository, find the oldest commit and fetch older commits
      for (const repo of repos) {
        try {
          console.log(`📂 Backfilling repository: ${repo.owner}/${repo.name}`)

          // Get the oldest commit date for this repository
          const oldestCommitDate = await this.getOldestCommitDate(repo.id)
          console.log(`📅 Oldest commit in DB: ${oldestCommitDate || 'none'}`)

          // Determine the date range for backfill
          let backfillEndDate = oldestCommitDate || new Date().toISOString()
          let backfillStartDate = requestedStartDate || '2020-01-01'

          // If we have an oldest commit, backfill from requested start date to that commit
          if (oldestCommitDate && requestedStartDate) {
            const oldestDate = new Date(oldestCommitDate)
            const requestedDate = new Date(requestedStartDate)

            if (requestedDate < oldestDate) {
              // Need to backfill from requested date to oldest commit
              backfillEndDate = oldestCommitDate
              console.log(
                `🔄 Backfilling from ${backfillStartDate} to ${backfillEndDate}`,
              )
            } else {
              // We already have commits for the requested range
              console.log(
                `✅ No backfill needed for ${repo.name} - already have commits for requested range`,
              )
              continue
            }
          } else if (!oldestCommitDate && requestedStartDate) {
            // No commits in DB, fetch from requested date to now
            backfillEndDate = new Date().toISOString()
            console.log(
              `🆕 No existing commits, fetching from ${backfillStartDate} to ${backfillEndDate}`,
            )
          }

          // Fetch commits from GitHub for the backfill period
          const response = await fetch('/api/commits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${githubToken}`,
            },
            body: JSON.stringify({
              repos: [{ owner: repo.owner, name: repo.name }],
              startDate: backfillStartDate,
              endDate: backfillEndDate,
              maxCommits: 10000, // Increased limit for backfill
              withPagination: true,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error(
              `❌ Failed to fetch commits for ${repo.name}: ${errorData.error}`,
            )
            continue
          }

          const result = await response.json()
          const commits = result.results?.[0]?.commits || []

          console.log(`📦 Fetched ${commits.length} commits for backfill`)
          totalFetchedCommits += commits.length

          // Store the commits
          if (commits.length > 0) {
            const storeResult = await this.storeCommits(
              commits,
              userId,
              repo.id,
            )
            if (storeResult.success) {
              totalNewCommits += commits.length
              console.log(
                `✅ Stored ${commits.length} new commits for ${repo.name}`,
              )
            } else {
              console.error(
                `❌ Failed to store commits for ${repo.name}: ${storeResult.error}`,
              )
            }
          }
        } catch (repoError) {
          console.error(
            `❌ Error processing repository ${repo.name}:`,
            repoError,
          )
          continue
        }
      }

      console.log(
        `✅ Backfill completed: ${totalNewCommits} new commits stored out of ${totalFetchedCommits} fetched`,
      )

      return {
        success: true,
        newCommits: totalNewCommits,
        totalCommits: totalFetchedCommits,
        error: undefined,
      }
    } catch (error) {
      console.error('❌ Error in backfillOlderCommits:', error)
      return {
        success: false,
        newCommits: 0,
        totalCommits: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get oldest commit date for a repository
   */
  static async getOldestCommitDate(repoId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('commits')
        .select('date')
        .eq('repo_id', repoId)
        .order('date', { ascending: true })
        .limit(1)

      if (error) {
        console.error('Error getting oldest commit date:', error)
        return null
      }

      return data?.[0]?.date || null
    } catch (error) {
      console.error('Error in getOldestCommitDate:', error)
      return null
    }
  }
}
