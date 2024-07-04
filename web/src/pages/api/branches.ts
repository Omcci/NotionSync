import { NextApiRequest, NextApiResponse } from 'next'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { repoName, orgName } = req.query as {
    repoName: string
    orgName: string
  }
  const url = `https://api.github.com/repos/${orgName}/${repoName}/branches`
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching branches: ${response.status}`)
    }

    const branches = await response.json()

    res.status(200).json({ branches })
  } catch (error: any) {
    console.error(error.message)
    res.status(500).json({ error: error.message })
  }
}
