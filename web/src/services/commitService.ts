import { query } from '@/lib/db'
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
    repoId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (commits.length === 0) {
        return { success: true }
      }

      // Build values for batch insert
      const values: string[] = []
      const params: any[] = []
      let paramIndex = 1

      commits.forEach(commit => {
        values.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10})`
        )
        params.push(
          repoId,
          commit.commit.message,
          commit.commit.author.name,
          commit.commit.author.date,
          commit.sha || null,
          commit.html_url || null,
          commit.status || 'Unverified',
          commit.avatar_url || commit.committer?.avatar_url || null,
          commit.authorDetails ? JSON.stringify(commit.authorDetails) : null,
          commit.diff ? JSON.stringify(commit.diff) : null,
          commit.actions ? JSON.stringify(commit.actions) : null
        )
        paramIndex += 11
      })

      await query(
        `INSERT INTO commits (repo_id, message, author, date, sha, html_url, status, avatar_url, author_details, diff, actions)
         VALUES ${values.join(', ')}
         ON CONFLICT (repo_id, sha) 
         DO UPDATE SET
           message = EXCLUDED.message,
           author = EXCLUDED.author,
           date = EXCLUDED.date,
           html_url = EXCLUDED.html_url,
           status = EXCLUDED.status,
           avatar_url = EXCLUDED.avatar_url,
           author_details = EXCLUDED.author_details,
           diff = EXCLUDED.diff,
           actions = EXCLUDED.actions,
           updated_at = NOW()
         WHERE commits.sha IS NOT NULL AND EXCLUDED.sha IS NOT NULL`,
        params
      )

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
    endDate: string
  ): Promise<{ commits: Commit[]; error?: string }> {
    try {
      // Normalize dates to ensure proper comparison
      const normalizedStartDate = new Date(startDate).toISOString()
      const normalizedEndDate = new Date(endDate).toISOString()

      // Build the query with JOIN to repositories table
      let sql = `
        SELECT 
          c.*,
          r.id as repo_id,
          r.name as repo_name,
          r.owner as repo_owner,
          r.user_id
        FROM commits c
        INNER JOIN repositories r ON c.repo_id = r.id
        WHERE r.user_id = $1
          AND c.date >= $2
          AND c.date <= $3
      `

      const params: any[] = [userId, normalizedStartDate, normalizedEndDate]

      // Add repo filter if provided
      if (repoIds.length > 0) {
        sql += ` AND c.repo_id = ANY($${params.length + 1})`
        params.push(repoIds)
      }

      sql += ` ORDER BY c.date DESC LIMIT 50000` // Large limit, but reasonable

      const result = await query<DatabaseCommit & {
        repo_name: string
        repo_owner: string
      }>(sql, params)

      // Transform database commits back to Commit format
      const commits: Commit[] = result.rows.map((dbCommit: any) => ({
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
        repoName: dbCommit.repo_name || '',
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
      const result = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM commits WHERE repo_id = $1',
        [repoId]
      )

      return parseInt(result.rows[0]?.count || '0', 10)
    } catch (error) {
      console.error('Error getting commits count:', error)
      return 0
    }
  }

  /**
   * Get latest commit date for a repository
   */
  static async getLatestCommitDate(repoId: string): Promise<string | null> {
    try {
      const result = await query<{ date: string }>(
        'SELECT date FROM commits WHERE repo_id = $1 ORDER BY date DESC LIMIT 1',
        [repoId]
      )

      return result.rows[0]?.date || null
    } catch (error) {
      console.error('Error getting latest commit date:', error)
      return null
    }
  }

  /**
   * Get oldest commit date for a repository
   */
  static async getOldestCommitDate(repoId: string): Promise<string | null> {
    try {
      const result = await query<{ date: string }>(
        'SELECT date FROM commits WHERE repo_id = $1 ORDER BY date ASC LIMIT 1',
        [repoId]
      )

      return result.rows[0]?.date || null
    } catch (error) {
      console.error('Error getting oldest commit date:', error)
      return null
    }
  }

  /**
   * Delete commits for a repository
   */
  static async deleteCommitsForRepo(
    repoId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await query('DELETE FROM commits WHERE repo_id = $1', [repoId])
      return { success: true }
    } catch (error) {
      console.error('Error deleting commits:', error)
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
    monthsBack: number = 12
  ): Promise<CommitSyncResult> {
    try {
      // Call the function directly instead of making an HTTP request
      const { results, timeWindows } = await fetchCommitsWithTimePagination(
        githubToken,
        repos.map(repo => ({ owner: repo.owner, name: repo.name })),
        monthsBack,
        5000 // maxCommitsPerRepo - increased for better coverage
      )

      // Store commits in database
      let totalNewCommits = 0
      for (const repoResult of results) {
        const repo = repos.find(
          r => `${r.owner}/${r.name}` === repoResult.pagination.repository
        )
        if (repo && repoResult.commits.length > 0) {
          const storeResult = await this.storeCommits(
            repoResult.commits,
            userId,
            repo.id
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
          0
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
    endDate?: string
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
          repos: repos.map(repo => ({
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
    requestedStartDate?: string
  ): Promise<CommitSyncResult> {
    try {
      console.log(
        `🔍 Starting backfill process for ${repos.length} repositories`
      )

      let totalNewCommits = 0
      let totalFetchedCommits = 0

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
                `🔄 Backfilling from ${backfillStartDate} to ${backfillEndDate}`
              )
            } else {
              // We already have commits for the requested range
              console.log(
                `✅ No backfill needed for ${repo.name} - already have commits for requested range`
              )
              continue
            }
          } else if (!oldestCommitDate && requestedStartDate) {
            // No commits in DB, fetch from requested date to now
            backfillEndDate = new Date().toISOString()
            console.log(
              `🆕 No existing commits, fetching from ${backfillStartDate} to ${backfillEndDate}`
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
              `❌ Failed to fetch commits for ${repo.name}: ${errorData.error}`
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
              repo.id
            )
            if (storeResult.success) {
              totalNewCommits += commits.length
              console.log(
                `✅ Stored ${commits.length} new commits for ${repo.name}`
              )
            } else {
              console.error(
                `❌ Failed to store commits for ${repo.name}: ${storeResult.error}`
              )
            }
          }
        } catch (repoError) {
          console.error(
            `❌ Error processing repository ${repo.name}:`,
            repoError
          )
          continue
        }
      }

      console.log(
        `✅ Backfill completed: ${totalNewCommits} new commits stored out of ${totalFetchedCommits} fetched`
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
}
