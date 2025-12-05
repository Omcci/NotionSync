import type { NextApiRequest, NextApiResponse } from 'next'
import { ReposResponse } from '../../../types/types'
import { GitHubService } from '@/services/githubService'

export const fetchUserRepos = async (githubToken: string) => {
  try {
    const repos = await GitHubService.getUserRepos(githubToken)
    return repos.map((repo) => ({
      id: repo.id.toString(),
      name: repo.name,
      owner: repo.full_name.split('/')[0],
    }))
  } catch (error) {
    console.error('Error in fetchUserRepos:', error)
    throw error
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
    console.error('Invalid or missing GitHub token')
    return res.status(400).json({ error: 'GitHub token is required' })
  }

  try {
    const repos = await fetchUserRepos(githubToken)
    res.status(200).json({ repos })
  } catch (error: any) {
    console.error('Error in repos API handler:', error.message)
    res.status(500).json({ error: error.message })
  }
}
