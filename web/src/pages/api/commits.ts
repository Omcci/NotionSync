import { NextApiRequest, NextApiResponse } from 'next'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { repoName, orgName, token } = req.query as {
    repoName: string
    orgName: string
    token: string
  }
  const url = `https://api.github.com/repos/${orgName}/${repoName}/commits`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching commits: ${response.status}`)
    }

    const commits = await response.json()
    const formattedCommits = commits.map((commit: any) => ({
      commit: commit.commit.message,
      branch: commit.commit.tree.sha,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      status: '',
      actions: ['View', 'Github', 'Notebook'],
    }))

    res.status(200).json(formattedCommits)
  } catch (error: any) {
    console.error(error.message)
    res.status(500).json({ error: error.message })
  }
}
