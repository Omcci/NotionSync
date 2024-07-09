// import type { NextApiRequest, NextApiResponse } from 'next'

// type Repo = {
//   id: string
//   name: string
//   org: string
// }

// type ReposResponse = {
//   repos?: Repo[]
//   error?: string
// }

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<ReposResponse>,
// ) {
//   if (req.method !== 'GET') {
//     res.setHeader('Allow', ['GET'])
//     return res.status(405).end(`Method ${req.method} Not Allowed`)
//   }
//   const { username } = req.query

//   if (!username || typeof username !== 'string') {
//     return res.status(400).json({ error: 'Invalid or missing username' })
//   }

//   const token = process.env.GITHUB_TOKEN
//   const url = `https://api.github.com/users/${username}/repos`

//   try {
//     const response = await fetch(url, {
//       headers: {
//         Authorization: `token ${token}`,
//       },
//     })

//     if (!response.ok) {
//       throw new Error(`Error fetching repositories: ${response.status}`)
//     }

//     const data = await response.json()
//     const repos = data.map((repo: any) => ({
//       id: repo.id,
//       name: repo.name,
//       org: repo.owner.login,
//     }))
//     console.log('Fetched repos:', repos)

//     res.status(200).json({ repos })
//   } catch (error) {
//     const errorMessage = (error as Error).message
//     res.status(500).json({ error: errorMessage })
//   }
// }

import type { NextApiRequest, NextApiResponse } from 'next'

export type Repo = {
  id: string
  name: string
  org: string
}

export type ReposResponse = {
  repos?: Repo[]
  error?: string
}

export const fetchUserRepos = async (githubToken: string, username: string) => {
  const url = `https://api.github.com/users/${username}/repos`
  try {
    const response = await fetch(url, {
      headers: { Authorization: `token ${githubToken}` },
    })
    if (!response.ok) {
      throw new Error(`Error fetching repositories: ${response.status}`)
    }
    const data = await response.json()
    return data.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      org: repo.owner.login,
    }))
  } catch (error) {
    console.error((error as Error).message)
    return []
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReposResponse>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }
  const { username } = req.query

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing username' })
  }

  const token = process.env.GITHUB_TOKEN

  try {
    const repos = await fetchUserRepos(token!, username)
    console.log('Fetched repos:', repos)
    res.status(200).json({ repos })
  } catch (error: any) {
    console.error('Error fetching repos:', error.message)
    res.status(500).json({ error: error.message })
  }
}
