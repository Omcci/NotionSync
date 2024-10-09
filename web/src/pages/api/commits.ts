// import { format } from 'date-fns'
// import { NextApiRequest, NextApiResponse } from 'next'
// import { Action } from '../../../types/types'

// export const fetchCommitsForUserInRepo = async (
//   githubToken: string,
//   orgName: string,
//   repoName: string,
//   page: string,
//   per_page: string,
//   since?: string,
//   until?: string,
// ) => {
//   let commitsUrl = `https://api.github.com/repos/${orgName}/${repoName}/commits?page=${page}&per_page=${per_page}`

//   if (since && until) {
//     commitsUrl += `&since=${since}&until=${until}`
//   }

//   const pullRequestsUrl = `https://api.github.com/repos/${orgName}/${repoName}/pulls?state=open`

//   const [commitsResponse, pullRequestsResponse] = await Promise.all([
//     fetch(commitsUrl, {
//       headers: {
//         Authorization: `token ${githubToken}`,
//       },
//     }),
//     fetch(pullRequestsUrl, {
//       headers: {
//         Authorization: `token ${githubToken}`,
//       },
//     }),
//   ])

//   if (!commitsResponse.ok) {
//     throw new Error(`Error fetching commits: ${commitsResponse.status}`)
//   }
//   if (!pullRequestsResponse.ok) {
//     throw new Error(
//       `Error fetching pull requests: ${pullRequestsResponse.status}`,
//     )
//   }

//   const commits = await commitsResponse.json()
//   const pullRequests = await pullRequestsResponse.json()

//   return { commits, pullRequests }
// }

// export const fetchAuthorDetails = async (
//   githubToken: string,
//   username: string,
// ) => {
//   const userUrl = `https://api.github.com/users/${username}`
//   const userResponse = await fetch(userUrl, {
//     headers: {
//       Authorization: `token ${githubToken}`,
//     },
//   })

//   if (!userResponse.ok) {
//     throw new Error(`Error fetching user details: ${userResponse.status}`)
//   }

//   return userResponse.json()
// }

// export const fetchCommitDiff = async (
//   commitSha: string,
//   githubToken: string,
//   orgName: string,
//   repoName: string,
// ) => {
//   const diffUrl = `https://api.github.com/repos/${orgName}/${repoName}/commits/${commitSha}`
//   const response = await fetch(diffUrl, {
//     headers: {
//       Authorization: `token ${githubToken}`,
//       Accept: 'application/vnd.github.v3.diff',
//     },
//   })

//   if (!response.ok) {
//     throw new Error(`Error fetching diff: ${response.status}`)
//   }

//   return response.text()
// }

// const TIMEZONE_OFFSET_PARIS = 2

// const parisTz = (dateString: string, formatPattern: string): string => {
//   const dateUTC = new Date(dateString)
//   const dateParis = new Date(
//     dateUTC.getTime() + TIMEZONE_OFFSET_PARIS * 60 * 60 * 1000,
//   )
//   return format(dateParis, formatPattern)
// }

// const getCommits = async (req: NextApiRequest, res: NextApiResponse) => {
//   const {
//     repoName,
//     orgName,
//     startDate,
//     endDate,
//     date,
//     allPages,
//     githubToken,
//     page = '1',
//     per_page = '10',
//   } = req.query as {
//     repoName: string
//     orgName: string
//     date?: string
//     startDate?: string
//     endDate?: string
//     allPages?: string
//     githubToken?: string
//     page: string
//     per_page: string
//   }

//   const token = githubToken || req.headers.authorization?.split(' ')[1]
//   if (!token) {
//     return res
//       .status(401)
//       .json({ error: 'Unauthorized: No GitHub token available' })
//   }

//   try {
//     let allCommits: any[] = []

//     if (allPages === 'true') {
//       let page = 1
//       const per_page = 100
//       while (true) {
//         const { commits } = await fetchCommitsForUserInRepo(
//           token!,
//           orgName,
//           repoName,
//           page.toString(),
//           per_page.toString(),
//           startDate,
//           endDate,
//         )

//         if (commits.length === 0) break

//         allCommits = allCommits.concat(commits)
//         page++
//       }
//     } else {
//       const { commits } = await fetchCommitsForUserInRepo(
//         token!,
//         orgName,
//         repoName,
//         page,
//         per_page,
//         startDate,
//         endDate,
//       )
//       allCommits = commits
//     }

//     let filteredCommits = allCommits

//     if (date) {
//       filteredCommits = allCommits.filter((commit: any) => {
//         const formattedCommitDate = parisTz(
//           commit.commit.author.date,
//           'yyyy-MM-dd',
//         )
//         return formattedCommitDate === date
//       })
//     }

//     const formattedCommits = await Promise.all(
//       filteredCommits.map(async (commit: any) => {
//         const formattedDate = parisTz(
//           commit.commit.author.date,
//           "yyyy-MM-dd'T'HH:mm:ssXXX",
//         )
//         const status =
//           commit.commit.verification && commit.commit.verification.verified
//             ? 'Verified'
//             : 'Unverified'

//         let authorDetails = null
//         let authorName = 'Unknown Author'
//         let committerAvatarUrl = 'https://github.com/identicons/default.png'

//         if (commit.author && commit.author.login) {
//           authorDetails = await fetchAuthorDetails(token!, commit.author.login)
//           authorName = commit.commit.author.name
//         } else {
//           authorDetails = {
//             name: 'Unknown Author',
//             bio: '',
//             location: '',
//             blog: '',
//             company: '',
//             avatar_url: committerAvatarUrl,
//             created_at: '',
//           }
//         }

//         const diff = await fetchCommitDiff(
//           commit.sha,
//           token!,
//           orgName,
//           repoName,
//         )

//         return {
//           commit: commit.commit.message,
//           commitSha: commit.sha,
//           branch: commit.commit.tree.sha,
//           author: commit.commit.author.name,
//           authorDetails: {
//             name: authorDetails.name,
//             bio: authorDetails.bio,
//             location: authorDetails.location,
//             blog: authorDetails.blog,
//             company: authorDetails.company,
//             avatar_url: authorDetails.avatar_url,
//             created_at: authorDetails.created_at,
//           },
//           date: formattedDate,
//           diff: diff,
//           status: status,
//           actions: [
//             { name: 'View on GitHub', url: commit.html_url },
//           ] as Action[],
//           avatar_url: commit.committer
//             ? commit.committer.avatar_url
//             : 'https://github.com/identicons/default.png',
//         }
//       }),
//     )

//     res.status(200).json(formattedCommits)
//   } catch (error: any) {
//     console.error(error.message)
//     res.status(500).json({ error: error.message })
//   }
// }

// export default getCommits

import { format } from 'date-fns'
import { NextApiRequest, NextApiResponse } from 'next'
import { Action } from '../../../types/types'

const TIMEZONE_OFFSET_PARIS = 2

const fetchCommitsAndPRs = async (
  githubToken: string,
  orgName: string,
  repoName: string,
  page: string,
  per_page: string,
  since?: string,
  until?: string,
) => {
  const commitsUrl = `https://api.github.com/repos/${orgName}/${repoName}/commits?page=${page}&per_page=${per_page}${
    since && until ? `&since=${since}&until=${until}` : ''
  }`
  const pullRequestsUrl = `https://api.github.com/repos/${orgName}/${repoName}/pulls?state=open`

  const [commitsResponse, pullRequestsResponse] = await Promise.all([
    fetch(commitsUrl, { headers: { Authorization: `token ${githubToken}` } }),
    fetch(pullRequestsUrl, {
      headers: { Authorization: `token ${githubToken}` },
    }),
  ])

  if (!commitsResponse.ok || !pullRequestsResponse.ok) {
    throw new Error(
      `Error fetching commits or pull requests: ${commitsResponse.status}, ${pullRequestsResponse.status}`,
    )
  }

  const [commits, pullRequests] = await Promise.all([
    commitsResponse.json(),
    pullRequestsResponse.json(),
  ])

  return { commits, pullRequests }
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
  orgName: string,
  repoName: string,
) => {
  const diffUrl = `https://api.github.com/repos/${orgName}/${repoName}/commits/${commitSha}`
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
  commits: any[],
  githubToken: string,
  orgName: string,
  repoName: string,
) => {
  return Promise.all(
    commits.map(async (commit: any) => {
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
        authorDetails = await fetchAuthorDetails(
          githubToken,
          commit.author.login,
        )
      }

      const diff = await fetchCommitDiff(
        commit.sha,
        githubToken,
        orgName,
        repoName,
      )

      return {
        commit: commit.commit.message,
        commitSha: commit.sha,
        branch: commit.commit.tree.sha,
        author: commit.commit.author.name,
        authorDetails,
        date: formattedDate,
        diff,
        status,
        actions: [{ name: 'View on GitHub', url: commit.html_url }] as Action[],
        avatar_url:
          commit.committer?.avatar_url ||
          'https://github.com/identicons/default.png',
      }
    }),
  )
}

const filterCommitsByDate = (commits: any[], date: string) => {
  return commits.filter(
    (commit: any) => parisTz(commit.commit.author.date, 'yyyy-MM-dd') === date,
  )
}

const fetchAllPagesCommits = async (
  token: string,
  orgName: string,
  repoName: string,
  startDate?: string,
  endDate?: string,
) => {
  const allCommits = []
  let page = 1
  const perPage = 100

  while (true) {
    const { commits } = await fetchCommitsAndPRs(
      token,
      orgName,
      repoName,
      page.toString(),
      perPage.toString(),
      startDate,
      endDate,
    )
    if (commits.length === 0) break
    allCommits.push(...commits)
    page++
  }

  return allCommits
}

const getCommits = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    repoName,
    orgName,
    startDate,
    endDate,
    date,
    allPages,
    githubToken,
    page = '1',
    per_page = '10',
  } = req.query as {
    repoName: string
    orgName: string
    date?: string
    startDate?: string
    endDate?: string
    allPages?: string
    githubToken?: string
    page: string
    per_page: string
  }

  const token = githubToken || req.headers.authorization?.split(' ')[1]
  if (!token)
    return res
      .status(401)
      .json({ error: 'Unauthorized: No GitHub token available' })

  try {
    let allCommits =
      allPages === 'true'
        ? await fetchAllPagesCommits(
            token,
            orgName,
            repoName,
            startDate,
            endDate,
          )
        : (
            await fetchCommitsAndPRs(
              token,
              orgName,
              repoName,
              page,
              per_page,
              startDate,
              endDate,
            )
          ).commits

    if (date) allCommits = filterCommitsByDate(allCommits, date)

    const formattedCommits = await processCommits(
      allCommits,
      token,
      orgName,
      repoName,
    )

    res.status(200).json(formattedCommits)
  } catch (error: any) {
    console.error(error.message)
    res.status(500).json({ error: error.message })
  }
}

export default getCommits
