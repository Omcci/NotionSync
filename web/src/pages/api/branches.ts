// src/pages/api/branches.ts
import { NextApiRequest, NextApiResponse } from 'next'

export const fetchRepoBranches = async (
  githubToken: string,
  orgName: string,
  repoName: string,
) => {
  const url = `https://api.github.com/repos/${orgName}/${repoName}/branches`
  try {
    const response = await fetch(url, {
      headers: { Authorization: `token ${githubToken}` },
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(
        `Error fetching branches for ${repoName}: ${response.status}`,
      )
    }
    return data.map((branch: any) => branch.name)
  } catch (error: any) {
    console.error(error.message)
    return []
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { repoName, orgName } = req.query as {
    repoName: string
    orgName: string
  }

  if (!repoName || !orgName) {
    return res
      .status(400)
      .json({ error: 'Missing repoName or orgName parameter' })
  }

  const token = process.env.GITHUB_TOKEN

  try {
    const branches = await fetchRepoBranches(token!, orgName, repoName)
    console.log('API is sending branches:', branches)
    res.status(200).json({ branches })
  } catch (error: any) {
    console.error('Error fetching branches:', error.message)
    res.status(500).json({ error: error.message })
  }
}
