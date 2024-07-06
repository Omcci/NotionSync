import { NextApiRequest, NextApiResponse } from 'next'

let config = {
  githubToken: process.env.GITHUB_TOKEN || '',
  notionToken: process.env.NOTION_TOKEN || '',
  repoName: process.env.REPO_NAME || '',
  orgName: process.env.ORG_NAME || '',
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(config)
  } else if (req.method === 'POST') {
    const { githubToken, notionToken, repoName, orgName } = req.body
    if (!githubToken || !notionToken || !repoName || !orgName) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    config = { githubToken, notionToken, repoName, orgName }
    res.status(200).json(config)
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
