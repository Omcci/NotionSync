import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { NextApiRequest, NextApiResponse } from 'next'
import { Action, Commit, Repo } from '../../../types/types'

// Cache for author details to avoid duplicate API calls
const authorCache = new Map<string, any>()
const AUTHOR_CACHE_TTL = 1000 * 60 * 60 // 1 hour

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

interface TimeWindow {
  startDate: string
  endDate: string
  period: string
}

// Generate time windows of 2 months each, starting from current date
const generateTimeWindows = (monthsBack: number = 24): TimeWindow[] => {
  const windows: TimeWindow[] = []
  const now = new Date()

  for (let i = 0; i < monthsBack; i += 2) {
    const endDate = i === 0 ? now : subMonths(now, i)
    const startDate = subMonths(endDate, 2)

    windows.push({
      startDate: startOfMonth(startDate).toISOString(),
      endDate: endOfMonth(endDate).toISOString(),
      period: `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`,
    })
  }

  return windows.reverse() // Oldest first
}

const fetchCommits = async (
  githubToken: string,
  owner: string,
  repoName: string,
  page: number = 1,
  per_page: number = 100,
  since?: string,
  until?: string
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
      `❌ GitHub API error: ${response.status} - ${response.statusText}`
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
  // Check cache first
  const cacheKey = `author_${username}`
  const cached = authorCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < AUTHOR_CACHE_TTL) {
    return cached.data
  }

  const userUrl = `https://api.github.com/users/${username}`
  const response = await fetch(userUrl, {
    headers: { Authorization: `token ${githubToken}` },
  })

  if (!response.ok) {
    // Return default author for non-critical failures
    if (response.status === 404) {
      return {
        name: username,
        bio: '',
        location: '',
        blog: '',
        company: '',
        avatar_url: 'https://github.com/identicons/default.png',
        created_at: '',
      }
    }
    throw new Error(`Error fetching user details: ${response.status}`)
  }

  const data = await response.json()
  // Cache the result
  authorCache.set(cacheKey, { data, timestamp: Date.now() })
  return data
}

// Use UTC consistently for all date operations to avoid timezone issues
const formatDateUTC = (dateString: string, formatPattern: string): string => {
  const date = new Date(dateString)
  return format(date, formatPattern)
}

const processCommits = async (
  commits: Commit[],
  githubToken: string,
  owner: string,
  repoName: string
): Promise<Commit[]> => {
  // Batch fetch unique authors to reduce API calls
  const uniqueAuthors = [
    ...new Set(commits.map(c => c.author?.login).filter(Boolean)),
  ] as string[]

  // Fetch all authors in parallel (with cache hits, this is very fast)
  const authorDetailsMap = new Map<string, any>()
  await Promise.all(
    uniqueAuthors.map(async login => {
      try {
        const details = await fetchAuthorDetails(githubToken, login)
        authorDetailsMap.set(login, details)
      } catch (error) {
        console.error(`Error fetching author details for ${login}: ${error}`)
      }
    })
  )

  const defaultAuthorDetails = {
    name: 'Unknown Author',
    bio: '',
    location: '',
    blog: '',
    company: '',
    avatar_url: 'https://github.com/identicons/default.png',
    created_at: '',
  }

  // Process commits synchronously (fast operation now)
  return commits.map((commit: Commit): Commit => {
    const formattedDate = formatDateUTC(
      commit.commit.author.date,
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    )
    const status = commit.commit.verification?.verified
      ? 'Verified'
      : 'Unverified'

    const authorDetails = commit.author?.login
      ? authorDetailsMap.get(commit.author.login) || defaultAuthorDetails
      : defaultAuthorDetails

    // Skip diff fetching - it creates placeholder data anyway
    // Diffs can be fetched on-demand when viewing commit details
    const diff: { filename: string; additions: number; deletions: number }[] =
      []

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
  })
}

export const fetchCommitsWithPagination = async (
  token: string,
  repos: { owner: string; name: string }[],
  maxCommitsPerRepo: number = 10000,
  startDate?: string,
  endDate?: string
): Promise<CommitFetchResult[]> => {
  const results: CommitFetchResult[] = []

  console.log(
    `🔍 Fetching commits with pagination for ${repos.length} repositories`
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
          endDate
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
          repo.name
        )

        allCommits.push(...processedCommits)

        // Check if we've reached our limit
        if (allCommits.length >= maxCommitsPerRepo) {
          console.log(
            `  ⚠️  Reached limit of ${maxCommitsPerRepo} commits for ${repo.name}`
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

        // Safety check: prevent infinite loops
        if (page > 100) {
          console.warn(
            `⚠️  Stopped fetching after 100 pages for ${repo.name} (safety limit)`
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
    0
  )
  console.log(`\n🎯 Pagination Summary:`)
  console.log(`  - Total commits fetched: ${totalCommits}`)
  console.log(`  - Repositories processed: ${results.length}`)

  results.forEach(result => {
    console.log(
      `  - ${result.pagination.repository}: ${result.pagination.totalFetched} commits ${result.reachedLimit ? '(limited)' : '(complete)'}`
    )
  })

  return results
}

// Legacy function for backward compatibility
export const fetchCommitsForMultipleRepos = async (
  token: string,
  repos: { owner: string; name: string }[],
  startDate?: string,
  endDate?: string
) => {
  const results = await fetchCommitsWithPagination(
    token,
    repos,
    10000,
    startDate,
    endDate
  )
  return results.flatMap(result => result.commits)
}

export const fetchCommitsForUserInRepo = async (
  githubToken: string,
  orgName: string,
  repoName: string,
  page: string,
  per_page: string,
  since?: string,
  until?: string
) => {
  const commits = await fetchCommits(
    githubToken,
    orgName,
    repoName,
    parseInt(page),
    parseInt(per_page),
    since,
    until
  )
  return { commits }
}

const getCommits = async (req: NextApiRequest, res: NextApiResponse) => {
  // Handle both GET and POST requests
  let repos: string
  let startDate: string | undefined
  let endDate: string | undefined
  let githubToken: string | undefined
  let maxCommits: string | undefined
  let withPagination: string | undefined
  let useTimePagination: string | undefined
  let monthsBack: string | undefined

  if (req.method === 'POST') {
    // Handle POST request with JSON body
    const body = req.body
    repos = JSON.stringify(body.repos)
    startDate = body.startDate
    endDate = body.endDate
    githubToken = body.githubToken
    maxCommits = body.maxCommits?.toString()
    withPagination = body.withPagination?.toString()
    useTimePagination = body.useTimePagination?.toString()
    monthsBack = body.monthsBack?.toString()
  } else if (req.method === 'GET') {
    // Handle GET request with query parameters
    const query = req.query as {
      repos: string
      startDate?: string
      endDate?: string
      githubToken?: string
      maxCommits?: string
      withPagination?: string
      useTimePagination?: string
      monthsBack?: string
    }
    repos = query.repos
    startDate = query.startDate
    endDate = query.endDate
    githubToken = query.githubToken
    maxCommits = query.maxCommits
    withPagination = query.withPagination
    useTimePagination = query.useTimePagination
    monthsBack = query.monthsBack
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = githubToken || req.headers.authorization?.split(' ')[1]
  if (!token)
    return res
      .status(401)
      .json({ error: 'Unauthorized: No GitHub token available' })

  try {
    const repoList = JSON.parse(repos)
    const maxCommitsPerRepo = maxCommits ? parseInt(maxCommits) : 10000 // Increased default for better coverage
    const usePagination = withPagination === 'true'
    const useTimeBasedPagination = useTimePagination === 'true'
    const monthsToFetch = monthsBack ? parseInt(monthsBack) : 24 // Increased from 12 to 24 months

    if (useTimeBasedPagination) {
      console.log(`🚀 Using intelligent time-based pagination`)
      const { results, timeWindows } = await fetchCommitsWithTimePagination(
        token,
        repoList,
        monthsToFetch,
        maxCommitsPerRepo
      )

      res.status(200).json({
        results,
        timeWindows,
        summary: {
          totalCommits: results.reduce(
            (sum, result) => sum + result.commits.length,
            0
          ),
          repositories: repoList.length,
          timeWindowsProcessed: timeWindows.length,
          limitedRepositories: results.filter(r => r.reachedLimit).length,
        },
      })
    } else if (usePagination) {
      console.log(`📄 Using traditional pagination`)
      const results = await fetchCommitsWithPagination(
        token,
        repoList,
        maxCommitsPerRepo,
        startDate,
        endDate
      )

      res.status(200).json({
        results,
        summary: {
          totalCommits: results.reduce(
            (sum, result) => sum + result.commits.length,
            0
          ),
          repositories: results.length,
          limitedRepositories: results.filter(r => r.reachedLimit).length,
        },
      })
    } else {
      // Legacy mode for backward compatibility
      console.log(`⚠️  Using legacy mode (not recommended for large datasets)`)
      const commits = await fetchCommitsForMultipleRepos(
        token,
        repoList,
        startDate,
        endDate
      )

      res.status(200).json(commits)
    }
  } catch (error: any) {
    console.error(error.message)
    res.status(500).json({ error: error.message })
  }
}

// Fetch commits for a specific time window
const fetchCommitsForTimeWindow = async (
  token: string,
  repos: { owner: string; name: string }[],
  timeWindow: TimeWindow,
  maxCommitsPerRepo: number = 10000 // Increased for better coverage
): Promise<CommitFetchResult[]> => {
  console.log(`\n📅 Fetching commits for period: ${timeWindow.period}`)
  console.log(
    `   From: ${format(new Date(timeWindow.startDate), 'yyyy-MM-dd')}`
  )
  console.log(`   To: ${format(new Date(timeWindow.endDate), 'yyyy-MM-dd')}`)

  const results: CommitFetchResult[] = []

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
          timeWindow.startDate,
          timeWindow.endDate
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
          repo.name
        )

        allCommits.push(...processedCommits)

        // Check if we've reached our limit
        if (allCommits.length >= maxCommitsPerRepo) {
          console.log(
            `  ⚠️  Reached limit of ${maxCommitsPerRepo} commits for ${repo.name}`
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

        // Safety check: prevent infinite loops
        if (page > 50) {
          // Increased from 10 to 50 for better coverage
          console.warn(
            `⚠️  Stopped fetching after 50 pages for ${repo.name} (safety limit)`
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

      // If it's a rate limit error, use exponential backoff
      if (error instanceof Error && error.message.includes('403')) {
        const retryDelays = [5000, 15000, 30000] // 5s, 15s, 30s exponential backoff

        for (let attempt = 0; attempt < retryDelays.length; attempt++) {
          const delay = retryDelays[attempt]
          console.log(
            `⏳ Rate limit hit, waiting ${delay / 1000}s before retry (attempt ${attempt + 1}/${retryDelays.length})...`
          )
          await new Promise(resolve => setTimeout(resolve, delay))

          try {
            console.log(`🔄 Retrying ${repo.owner}/${repo.name}...`)
            const retryResult = await fetchCommitsForTimeWindow(
              token,
              [repo],
              timeWindow,
              maxCommitsPerRepo
            )
            results.push(...retryResult)
            break // Success, exit retry loop
          } catch (retryError) {
            if (attempt === retryDelays.length - 1) {
              console.error(
                `❌ All retries failed for ${repo.name}:`,
                retryError
              )
            }
          }
        }
        continue
      }

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
    0
  )
  console.log(`\n📊 Period Summary (${timeWindow.period}):`)
  console.log(`  - Total commits fetched: ${totalCommits}`)
  console.log(`  - Repositories processed: ${results.length}`)

  return results
}

// New function for intelligent time-based pagination
export const fetchCommitsWithTimePagination = async (
  token: string,
  repos: { owner: string; name: string }[],
  monthsBack: number = 24, // Increased from 12 to 24 months
  maxCommitsPerRepo: number = 10000 // Increased for better coverage
): Promise<{ results: CommitFetchResult[]; timeWindows: TimeWindow[] }> => {
  console.log(`🔍 Starting intelligent time-based pagination`)
  console.log(`📅 Fetching commits for the last ${monthsBack} months`)
  console.log(`🎯 Max commits per repo per period: ${maxCommitsPerRepo}`)

  const timeWindows = generateTimeWindows(monthsBack)
  const allResults: CommitFetchResult[] = []

  for (const timeWindow of timeWindows) {
    console.log(`\n🕐 Processing time window: ${timeWindow.period}`)

    const windowResults = await fetchCommitsForTimeWindow(
      token,
      repos,
      timeWindow,
      maxCommitsPerRepo
    )

    allResults.push(...windowResults)
  }

  const totalCommits = allResults.reduce(
    (sum, result) => sum + result.commits.length,
    0
  )
  console.log(`\n🎯 Final Summary:`)
  console.log(`  - Total commits fetched: ${totalCommits}`)
  console.log(`  - Time windows processed: ${timeWindows.length}`)
  console.log(`  - Repositories processed: ${repos.length}`)

  return { results: allResults, timeWindows }
}

export default getCommits
