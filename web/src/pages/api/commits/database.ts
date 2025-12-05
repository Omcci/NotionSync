import { NextApiRequest, NextApiResponse } from 'next'
import { CommitService } from '@/services/commitService'
import { RepositoryService } from '@/services/repositoryService'
import { supabase } from '@/lib/supabaseClient'

interface DatabaseRequest {
  userId: string
  startDate?: string
  endDate?: string
  sync?: string
  useTimePagination?: string
  monthsBack?: string
  backfill?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const {
    userId,
    startDate,
    endDate,
    sync,
    useTimePagination,
    monthsBack,
    backfill,
  } = req.query as unknown as DatabaseRequest

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' })
  }

  // Early validation for sync operations
  let githubToken: string | undefined = undefined

  if (sync === 'true' || backfill === 'true') {
    githubToken = req.headers.authorization?.replace('Bearer ', '') || undefined

    if (!githubToken) {
      // Fallback to session token
      const {
        data: { session },
      } = await supabase.auth.getSession()
      githubToken = session?.provider_token || undefined

      if (!githubToken) {
        return res.status(401).json({
          message: 'GitHub token not found',
          error:
            'No GitHub access token available. Please re-authenticate with GitHub.',
          authRequired: true,
          redirectTo: '/login',
        })
      }
    }
  }

  try {
    // Get user's repositories
    const { repositories: repos, error: reposError } =
      await RepositoryService.getUserRepositories(userId)

    if (reposError) {
      return res.status(500).json({
        message: 'Failed to fetch user repositories',
        error: reposError,
      })
    }

    // Check if we need to backfill older commits
    if (backfill === 'true' && githubToken) {
      console.log(`🔄 Starting intelligent backfill process...`)

      const repoIds = repos.map(repo => repo.id)
      const backfillResult = await CommitService.backfillOlderCommits(
        userId,
        repos,
        githubToken,
        startDate
      )

      if (!backfillResult.success) {
        console.error(`❌ Backfill failed: ${backfillResult.error}`)
      } else {
        console.log(
          `✅ Backfill completed: ${backfillResult.newCommits} new commits`
        )
      }
    }

    if (sync === 'true') {
      if (useTimePagination === 'true') {
        // Use intelligent time-based pagination
        const monthsToFetch = monthsBack ? parseInt(monthsBack) : 24 // Increased from 2 to 24 months

        const syncResult = await CommitService.syncCommitsWithTimePagination(
          userId,
          repos,
          githubToken!,
          monthsToFetch
        )

        if (!syncResult.success) {
          return res.status(500).json({
            message: 'Failed to sync commits',
            error: syncResult.error,
          })
        }
      } else {
        // Use traditional sync method
        const syncResult = await CommitService.syncCommitsForRepos(
          userId,
          repos,
          githubToken!,
          startDate,
          endDate
        )

        if (!syncResult.success) {
          return res.status(500).json({
            message: 'Failed to sync commits',
            error: syncResult.error,
          })
        }
      }
    }

    // Fetch commits from database
    const repoIds = repos.map(repo => repo.id)
    const actualStartDate = startDate || '2020-01-01'
    const actualEndDate = endDate || new Date().toISOString()

    const { commits, error } = await CommitService.getCommits(
      userId,
      repoIds,
      actualStartDate,
      actualEndDate
    )

    if (error) {
      return res.status(500).json({
        message: 'Failed to fetch commits from database',
        error,
      })
    }

    // Check if we have commits for the requested start date
    const hasCommitsForRequestedRange = startDate
      ? commits.some(
          commit => commit.date && new Date(commit.date) >= new Date(startDate!)
        )
      : true

    // Compute repository stats from already-fetched commits (avoids N+1 queries)
    // Group commits by repoName for O(n) stats computation
    const commitsByRepo = new Map<string, { count: number; dates: string[] }>()

    for (const commit of commits) {
      const repoName = commit.repoName
      if (!repoName) continue

      const existing = commitsByRepo.get(repoName) || { count: 0, dates: [] }
      existing.count++
      const commitDate = commit.commit?.author?.date
      if (commitDate) {
        existing.dates.push(commitDate)
      }
      commitsByRepo.set(repoName, existing)
    }

    // Build stats from the grouped data
    const repoStats = repos.map(repo => {
      const repoData = commitsByRepo.get(repo.name) || { count: 0, dates: [] }
      const sortedDates = repoData.dates.sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      )

      return {
        id: repo.id,
        name: repo.name,
        owner: repo.owner,
        commitCount: repoData.count,
        latestCommitDate: sortedDates[0] || null,
        oldestCommitDate: sortedDates[sortedDates.length - 1] || null,
      }
    })

    res.status(200).json({
      commits: commits,
      repositories: repoStats,
      summary: {
        totalCommits: commits.length,
        returnedCommits: commits.length,
        hasMoreCommits: false,
        repositories: repos.length,
        hasCommitsForRequestedRange,
        dateRange: {
          start: actualStartDate,
          end: actualEndDate,
        },
        backfillSuggested: !hasCommitsForRequestedRange && Boolean(startDate),
      },
    })
  } catch (error) {
    console.error('❌ Database API error:', error)

    // Handle rate limit errors specifically
    if (error instanceof Error && error.message.includes('rate limit')) {
      return res.status(429).json({
        message: 'GitHub API rate limit exceeded',
        error: error.message,
        retryAfter: 3600, // 1 hour
      })
    }

    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
