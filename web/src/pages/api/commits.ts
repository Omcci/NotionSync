import { format } from 'date-fns'
import { NextApiRequest, NextApiResponse } from 'next'
import { Action, Commit, Repo } from '../../../types/types'

const TIMEZONE_OFFSET_PARIS = 2

interface PaginationInfo {
  currentPage: number
  totalFetched: number
  hasMore: boolean
  oldestCommitDate?: string
  repository: string
}

interface CommitFetchResult {
  commits: Commit[]
  pagination: PaginationInfo
  reachedLimit: boolean
  message?: string
}

const fetchCommits = async (
  githubToken: string,
  owner: string,
  repoName: string,
  page: number = 1,
  per_page: number = 100,
  since?: string,
  until?: string,
) => {
  const commitsUrl = `https://api.github.com/repos/${owner}/${repoName}/commits?page=${page}&per_page=${per_page}${
    since && until ? `&since=${since}&until=${until}` : ''
  }`

  console.log(`🌐 GitHub API call: ${commitsUrl}`)

  const response = await fetch(commitsUrl, {
    headers: { Authorization: `token ${githubToken}` },
  })

  if (!response.ok) {
    console.error(
      `❌ GitHub API error: ${response.status} - ${response.statusText}`,
    )
    throw new Error(`Error fetching commits: ${response.status}`)
  }

  const commits = await response.json()
  if (!commits || !Array.isArray(commits)) {
    console.error(`❌ Invalid commits response:`, commits)
    throw new Error(`Invalid commits response: ${JSON.stringify(commits)}`)
  }

  console.log(`✅ GitHub API returned ${commits.length} commits`)
  return commits
}

const fetchAuthorDetails = async (githubToken: string, username: string) => {
  const userUrl = `https://api.github.com/users/${username}`
  const response = await fetch(userUrl, {
    headers: { Authorization: `token ${githubToken}` },
  })

  if (!response.ok)
    throw new Error(`Error fetching user details: ${response.status}`)
  return response.json()
}

const fetchCommitDiff = async (
  commitSha: string,
  githubToken: string,
  owner: string,
  repoName: string,
) => {
  const diffUrl = `https://api.github.com/repos/${owner}/${repoName}/commits/${commitSha}`
  const response = await fetch(diffUrl, {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: 'application/vnd.github.v3.diff',
    },
  })

  if (!response.ok) throw new Error(`Error fetching diff: ${response.status}`)
  return response.text()
}

const parisTz = (dateString: string, formatPattern: string): string => {
  const dateUTC = new Date(dateString)
  const dateParis = new Date(
    dateUTC.getTime() + TIMEZONE_OFFSET_PARIS * 60 * 60 * 1000,
  )
  return format(dateParis, formatPattern)
}

const processCommits = async (
  commits: Commit[],
  githubToken: string,
  owner: string,
  repoName: string,
): Promise<Commit[]> => {
  return Promise.all(
    commits.map(async (commit: Commit): Promise<Commit> => {
      const formattedDate = parisTz(
        commit.commit.author.date,
        "yyyy-MM-dd'T'HH:mm:ssXXX",
      )
      const status = commit.commit.verification?.verified
        ? 'Verified'
        : 'Unverified'

      let authorDetails = {
        name: 'Unknown Author',
        bio: '',
        location: '',
        blog: '',
        company: '',
        avatar_url: 'https://github.com/identicons/default.png',
        created_at: '',
      }

      if (commit.author?.login) {
        try {
          authorDetails = await fetchAuthorDetails(
            githubToken,
            commit.author.login,
          )
        } catch (error) {
          console.error(`Error fetching author details: ${error}`)
        }
      }

      let diff: { filename: string; additions: number; deletions: number }[] =
        []
      try {
        const diffText = await fetchCommitDiff(
          commit.sha,
          githubToken,
          owner,
          repoName,
        )
        // Parse diff text to extract file changes (simplified)
        diff = [{ filename: 'diff.txt', additions: 0, deletions: 0 }]
      } catch (error) {
        console.error(`Error fetching diff for commit ${commit.sha}: ${error}`)
      }

      return {
        ...commit,
        repoName,
        date: formattedDate,
        status,
        authorDetails,
        actions: [{ name: 'View on GitHub', url: commit.html_url }] as Action[],
        avatar_url: commit.committer?.avatar_url || authorDetails.avatar_url,
        diff,
      }
    }),
  )
}

export const fetchCommitsWithPagination = async (
  token: string,
  repos: { owner: string; name: string }[],
  maxCommitsPerRepo: number = 1000,
  startDate?: string,
  endDate?: string,
): Promise<CommitFetchResult[]> => {
  const results: CommitFetchResult[] = []

  console.log(
    `🔍 Fetching commits with pagination for ${repos.length} repositories`,
  )
  console.log(`📅 Date range: ${startDate} to ${endDate}`)
  console.log(`🎯 Max commits per repo: ${maxCommitsPerRepo}`)

  for (const repo of repos) {
    try {
      console.log(`\n📂 Processing repository: ${repo.owner}/${repo.name}`)

      let page = 1
      const perPage = 100
      let allCommits: Commit[] = []
      let hasMore = true
      let reachedLimit = false

      while (hasMore && allCommits.length < maxCommitsPerRepo) {
        console.log(`  📄 Fetching page ${page} for ${repo.name}`)

        const commits = await fetchCommits(
          token,
          repo.owner,
          repo.name,
          page,
          perPage,
          startDate,
          endDate,
        )

        if (!commits || commits.length === 0) {
          console.log(`  ✅ No more commits on page ${page} for ${repo.name}`)
          hasMore = false
          break
        }

        console.log(`  📦 Found ${commits.length} commits on page ${page}`)

        const processedCommits = await processCommits(
          commits,
          token,
          repo.owner,
          repo.name,
        )

        allCommits.push(...processedCommits)

        // Check if we've reached our limit
        if (allCommits.length >= maxCommitsPerRepo) {
          console.log(
            `  ⚠️  Reached limit of ${maxCommitsPerRepo} commits for ${repo.name}`,
          )
          allCommits = allCommits.slice(0, maxCommitsPerRepo)
          reachedLimit = true
          hasMore = false
        }

        // If we got less than requested, we've reached the end
        if (commits.length < perPage) {
          console.log(`  ✅ Reached end of commits for ${repo.name}`)
          hasMore = false
        }

        page++

        // Add a small delay to avoid hitting GitHub API rate limits
        if (page > 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Safety check: prevent infinite loops
        if (page > 50) {
          console.warn(
            `⚠️  Stopped fetching after 50 pages for ${repo.name} (safety limit)`,
          )
          hasMore = false
          reachedLimit = true
        }
      }

      const oldestCommit = allCommits[allCommits.length - 1]
      const oldestCommitDate = oldestCommit
        ? oldestCommit.commit.author.date
        : undefined

      const result: CommitFetchResult = {
        commits: allCommits,
        pagination: {
          currentPage: page - 1,
          totalFetched: allCommits.length,
          hasMore: reachedLimit,
          oldestCommitDate,
          repository: `${repo.owner}/${repo.name}`,
        },
        reachedLimit,
        message: reachedLimit
          ? `Fetched ${allCommits.length} commits (limit reached). Oldest commit: ${oldestCommitDate ? format(new Date(oldestCommitDate), 'MMM d, yyyy') : 'unknown'}`
          : `Fetched all ${allCommits.length} commits`,
      }

      console.log(`✅ Repository ${repo.name}: ${result.message}`)
      results.push(result)
    } catch (error) {
      console.error(`❌ Error fetching commits for repo ${repo.name}:`, error)
      results.push({
        commits: [],
        pagination: {
          currentPage: 0,
          totalFetched: 0,
          hasMore: false,
          repository: `${repo.owner}/${repo.name}`,
        },
        reachedLimit: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
      continue
    }
  }

  const totalCommits = results.reduce(
    (sum, result) => sum + result.commits.length,
    0,
  )
  console.log(`\n🎯 Pagination Summary:`)
  console.log(`  - Total commits fetched: ${totalCommits}`)
  console.log(`  - Repositories processed: ${results.length}`)

  results.forEach((result) => {
    console.log(
      `  - ${result.pagination.repository}: ${result.pagination.totalFetched} commits ${result.reachedLimit ? '(limited)' : '(complete)'}`,
    )
  })

  return results
}

// Legacy function for backward compatibility
export const fetchCommitsForMultipleRepos = async (
  token: string,
  repos: { owner: string; name: string }[],
  startDate?: string,
  endDate?: string,
) => {
  const results = await fetchCommitsWithPagination(
    token,
    repos,
    1000,
    startDate,
    endDate,
  )
  return results.flatMap((result) => result.commits)
}

export const fetchCommitsForUserInRepo = async (
  githubToken: string,
  orgName: string,
  repoName: string,
  page: string,
  per_page: string,
  since?: string,
  until?: string,
) => {
  const commits = await fetchCommits(
    githubToken,
    orgName,
    repoName,
    parseInt(page),
    parseInt(per_page),
    since,
    until,
  )
  return { commits }
}

const getCommits = async (req: NextApiRequest, res: NextApiResponse) => {
  const { repos, startDate, endDate, githubToken, maxCommits, withPagination } =
    req.query as {
      repos: string
      startDate?: string
      endDate?: string
      githubToken?: string
      maxCommits?: string
      withPagination?: string
    }

  const token = githubToken || req.headers.authorization?.split(' ')[1]
  if (!token)
    return res
      .status(401)
      .json({ error: 'Unauthorized: No GitHub token available' })

  try {
    const repoList = JSON.parse(repos)
    const maxCommitsPerRepo = maxCommits ? parseInt(maxCommits) : 1000
    const usePagination = withPagination === 'true'

    if (usePagination) {
      const results = await fetchCommitsWithPagination(
        token,
        repoList,
        maxCommitsPerRepo,
        startDate,
        endDate,
      )

      res.status(200).json({
        results,
        summary: {
          totalCommits: results.reduce(
            (sum, result) => sum + result.commits.length,
            0,
          ),
          repositories: results.length,
          limitedRepositories: results.filter((r) => r.reachedLimit).length,
        },
      })
    } else {
      // Legacy mode for backward compatibility
      const commits = await fetchCommitsForMultipleRepos(
        token,
        repoList,
        startDate,
        endDate,
      )

      res.status(200).json(commits)
    }
  } catch (error: any) {
    console.error(error.message)
    res.status(500).json({ error: error.message })
  }
}

export default getCommits
