import { format } from 'date-fns'
import { NextApiRequest, NextApiResponse } from 'next'
import { Action, Commit, Repo } from '../../../types/types'

const TIMEZONE_OFFSET_PARIS = 2

const fetchCommits = async (
  githubToken: string,
  owner: string,
  repoName: string,
  page: string,
  per_page: string,
  since?: string,
  until?: string,
) => {
  const commitsUrl = `https://api.github.com/repos/${owner}/${repoName}/commits?page=${page}&per_page=${per_page}${since && until ? `&since=${since}&until=${until}` : ''
    }`

  const response = await fetch(commitsUrl, {
    headers: { Authorization: `token ${githubToken}` },
  })

  if (!response.ok) {
    throw new Error(`Error fetching commits: ${response.status}`)
  }

  const commits = await response.json()
  if (!commits || !Array.isArray(commits)) {
    throw new Error(`Invalid commits response: ${JSON.stringify(commits)}`)
  }
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

export const fetchCommitsForMultipleRepos = async (
  token: string,
  repos: { owner: string; name: string }[],
  startDate?: string,
  endDate?: string,
) => {
  const allCommits = []

  for (const repo of repos) {
    try {
      let page = 1
      const perPage = 100

      while (true) {
        const commits = await fetchCommits(
          token,
          repo.owner,
          repo.name,
          page.toString(),
          perPage.toString(),
          startDate,
          endDate,
        )

        if (!commits || commits.length === 0) {
          break
        }

        const processedCommits = await processCommits(
          commits,
          token,
          repo.owner,
          repo.name,
        )
        allCommits.push(...processedCommits)
        page++
      }
    } catch (error) {
      console.error(`Error fetching commits for repo ${repo.name}: ${error}`)
      continue
    }
  }

  return allCommits
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
    page,
    per_page,
    since,
    until,
  )
  return { commits }
}

const getCommits = async (req: NextApiRequest, res: NextApiResponse) => {
  const { repos, startDate, endDate, githubToken } = req.query as {
    repos: string
    startDate?: string
    endDate?: string
    githubToken?: string
  }

  const token = githubToken || req.headers.authorization?.split(' ')[1]
  if (!token)
    return res
      .status(401)
      .json({ error: 'Unauthorized: No GitHub token available' })

  try {
    const repoList = JSON.parse(repos)
    const commits = await fetchCommitsForMultipleRepos(
      token,
      repoList,
      startDate,
      endDate,
    )

    res.status(200).json(commits)
  } catch (error: any) {
    console.error(error.message)
    res.status(500).json({ error: error.message })
  }
}

export default getCommits
