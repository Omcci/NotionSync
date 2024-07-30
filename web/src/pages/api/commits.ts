// import { NextApiRequest, NextApiResponse } from 'next'
// import { Action } from '../../../types/types'

// export default async (req: NextApiRequest, res: NextApiResponse) => {
//   const {
//     repoName,
//     orgName,
//     page = '1',
//     per_page = '10',
//   } = req.query as {
//     repoName: string
//     orgName: string
//     page: string
//     per_page: string
//   }

//   console.log(`Fetching commits for ${orgName}/${repoName}`)

//   const commitsUrl = `https://api.github.com/repos/${orgName}/${repoName}/commits?page=${page}&per_page=${per_page}`
//   const pullRequestsUrl = `https://api.github.com/repos/${orgName}/${repoName}/pulls?state=open`
//   const token = process.env.GITHUB_TOKEN

//   console.log(`GitHub API URL: ${commitsUrl}`)
//   console.log(`GitHub Token: ${token ? 'Present' : 'Not Present'}`)

//   try {
//     const [commitsResponse, pullRequestsResponse] = await Promise.all([
//       fetch(commitsUrl, {
//         headers: {
//           Authorization: `token ${token}`,
//         },
//       }),
//       fetch(pullRequestsUrl, {
//         headers: {
//           Authorization: `token ${token}`,
//         },
//       }),
//     ])

//     console.log(`Commits Status: ${commitsResponse.status}`)
//     console.log(`Pull Requests Status: ${pullRequestsResponse.status}`)

//     // Read the raw response text
//     const rawCommitsResponse = await commitsResponse.text()
//     const rawPullRequestsResponse = await pullRequestsResponse.text()

//     if (!commitsResponse.ok) {
//       throw new Error(`Error fetching commits: ${commitsResponse.status}`)
//     }
//     if (!pullRequestsResponse.ok) {
//       throw new Error(
//         `Error fetching pull requests: ${pullRequestsResponse.status}`,
//       )
//     }

//     let commits, pullRequests
//     try {
//       commits = JSON.parse(rawCommitsResponse)
//       pullRequests = JSON.parse(rawPullRequestsResponse)
//     } catch (parseError) {
//       throw new Error(
//         `Failed to parse JSON response: ${(parseError as Error).message}`,
//       )
//     }

//     // console.log(`Commits: ${JSON.stringify(commits)}`)

//     const formattedCommits = commits.map((commit: any) => {
//       const status =
//         commit.commit.verification && commit.commit.verification.verified
//           ? 'Verified'
//           : 'Unverified'
//       const pullRequest = pullRequests.find(
//         (pr: any) => pr.head.sha === commit.sha,
//       )
//       const pullRequestStatus = pullRequest ? 'Open PR' : 'No PR'

//       return {
//         commit: commit.commit.message,
//         branch: commit.commit.tree.sha,
//         author: commit.commit.author.name,
//         date: commit.commit.author.date,
//         status: status,
//         pullRequestStatus: pullRequestStatus,
//         actions: [
//           { name: 'View', url: `${commitsUrl}/${commit.sha}` },
//           { name: 'Github', url: commit.html_url },
//         ] as Action[],
//         avatar_url: commit.committer
//           ? commit.committer.avatar_url
//           : 'https://github.com/identicons/default.png',
//       }
//     })

//     res.status(200).json(formattedCommits)
//   } catch (error: any) {
//     console.error(error.message)
//     res.status(500).json({ error: error.message })
//   }
// }

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

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    repoName,
    orgName,
    page = '1',
    per_page = '10',
  } = req.query as {
    repoName: string
    orgName: string
    page: string
    per_page: string
  }

  console.log(`Fetching commits for ${orgName}/${repoName}`)

  const token = process.env.GITHUB_TOKEN

  try {
    const { commits, pullRequests } = await fetchCommitsForUserInRepo(
      token!,
      orgName,
      repoName,
      page,
      per_page,
    )

    const formattedCommits = await Promise.all(
      commits.map(async (commit: any) => {
        const status =
          commit.commit.verification && commit.commit.verification.verified
            ? 'Verified'
            : 'Unverified'
        const pullRequest = pullRequests.find(
          (pr: any) => pr.head.sha === commit.sha,
        )
        const pullRequestStatus = pullRequest ? 'Open PR' : 'No PR'

        const authorDetails = await fetchAuthorDetails(
          token!,
          commit.author.login,
        )
        console.log('Author Details:', authorDetails)

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
          },
          date: commit.commit.author.date,
          status: status,
          pullRequestStatus: pullRequestStatus,
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
