import { NextApiRequest, NextApiResponse } from 'next'
import { Action } from '../../../types/types'

export const fetchCommitsForUserInRepo = async (
  githubToken: string,
  orgName: string,
  repoName: string,
  page: string,
  per_page: string,
) => {
  const commitsUrl = `https://api.github.com/repos/${orgName}/${repoName}/commits?page=${page}&per_page=${per_page}`
  const pullRequestsUrl = `https://api.github.com/repos/${orgName}/${repoName}/pulls?state=open`

  const [commitsResponse, pullRequestsResponse] = await Promise.all([
    fetch(commitsUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
      },
    }),
    fetch(pullRequestsUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
      },
    }),
  ])

  if (!commitsResponse.ok) {
    throw new Error(`Error fetching commits: ${commitsResponse.status}`)
  }
  if (!pullRequestsResponse.ok) {
    throw new Error(
      `Error fetching pull requests: ${pullRequestsResponse.status}`,
    )
  }

  const commits = await commitsResponse.json()
  const pullRequests = await pullRequestsResponse.json()

  return { commits, pullRequests }
}

export const fetchAuthorDetails = async (
  githubToken: string,
  username: string,
) => {
  const userUrl = `https://api.github.com/users/${username}`
  const userResponse = await fetch(userUrl, {
    headers: {
      Authorization: `token ${githubToken}`,
    },
  })

  if (!userResponse.ok) {
    throw new Error(`Error fetching user details: ${userResponse.status}`)
  }

  return userResponse.json()
}

export const fetchAllCommitsForRepo = async (
  githubToken: string,
  orgName: string,
  repoName: string,
) => {
  let page = 1
  const per_page = 100
  let allCommits: any = []

  while (true) {
    const { commits } = await fetchCommitsForUserInRepo(
      githubToken,
      orgName,
      repoName,
      page.toString(),
      per_page.toString(),
    )

    if (commits.length === 0) break

    allCommits = allCommits.concat(commits)
    page++
  }

  return allCommits
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    repoName,
    orgName,
    // page = '1',
    // per_page = '10',
    date,
  } = req.query as {
    repoName: string
    orgName: string
    // page: string
    // per_page: string
    date?: string
  }

  console.log(`Fetching commits for ${orgName}/${repoName}`)

  const token = process.env.GITHUB_TOKEN

  try {
    const allCommits = await fetchAllCommitsForRepo(
      token!,
      orgName,
      repoName,
      // page,
      // per_page,
    )

    let filteredCommits = allCommits

    if (date) {
      filteredCommits = allCommits.filter((commit: any) => {
        const commitDate = new Date(commit.commit.author.date)
          .toISOString()
          .split('T')[0]
        return commitDate === date
      })
    }

    const formattedCommits = await Promise.all(
      filteredCommits.map(async (commit: any) => {
        const status =
          commit.commit.verification && commit.commit.verification.verified
            ? 'Verified'
            : 'Unverified'

        let authorDetails = null
        let authorName = 'Unknown Author'
        let committerAvatarUrl = 'https://github.com/identicons/default.png'

        if (commit.author && commit.author.login) {
          authorDetails = await fetchAuthorDetails(token!, commit.author.login)
          authorName = commit.commit.author.name
        } else {
          authorDetails = {
            name: 'Unknown Author',
            bio: '',
            location: '',
            blog: '',
            company: '',
            avatar_url: committerAvatarUrl,
            created_at: '',
          }
        }
        // console.log('Author Details:', authorDetails)

        return {
          commit: commit.commit.message,
          branch: commit.commit.tree.sha,
          author: commit.commit.author.name,
          authorDetails: {
            name: authorDetails.name,
            bio: authorDetails.bio,
            location: authorDetails.location,
            blog: authorDetails.blog,
            company: authorDetails.company,
            avatar_url: authorDetails.avatar_url,
            created_at: authorDetails.created_at,
          },
          date: commit.commit.author.date,
          status: status,
          actions: [
            { name: 'View', url: `${commit.html_url}` },
            { name: 'Github', url: commit.html_url },
          ] as Action[],
          avatar_url: commit.committer
            ? commit.committer.avatar_url
            : 'https://github.com/identicons/default.png',
        }
      }),
    )

    res.status(200).json(formattedCommits)
  } catch (error: any) {
    console.error(error.message)
    res.status(500).json({ error: error.message })
  }
}
