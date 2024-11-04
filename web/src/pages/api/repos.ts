import type { NextApiRequest, NextApiResponse } from 'next'
import { ReposResponse } from '../../../types/types'

export const fetchUserRepos = async (githubToken: string) => {
  const url = `https://api.github.com/user/repos`
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
      owner: repo.owner.login,
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
  const { githubToken } = req.query

  if (!githubToken || typeof githubToken !== 'string') {
    return res.status(400).json({ error: 'GitHub token is required' })
  }

  try {
    const repos = await fetchUserRepos(githubToken)
    res.status(200).json({ repos })
  } catch (error: any) {
    console.error('Error fetching repos:', error.message)
    res.status(500).json({ error: error.message })
  }
}
