import { NextApiRequest, NextApiResponse } from 'next'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { repoName, orgName } = req.query as {
    repoName: string
    orgName: string
  }

  console.log(`Fetching commits for ${orgName}/${repoName}`)

  const url = `https://api.github.com/repos/${orgName}/${repoName}/commits`
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN

  console.log(`GitHub API URL: ${url}`)
  console.log(`GitHub Token: ${token ? 'Present' : 'Not Present'}`)

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
      },
    })

    console.log(`Status: ${response.status}`)
    console.log(`Headers: ${JSON.stringify(response.headers)}`)

    // Read the raw response text
    const rawResponse = await response.text()

    if (!response.ok) {
      throw new Error(`Error fetching commits: ${response.status}`)
    }

    if (!response.ok) {
      throw new Error(
        `Error fetching commits: ${response.status} - ${rawResponse}`,
      )
    }

    // Attempt to parse the response as JSON
    let commits
    try {
      commits = JSON.parse(rawResponse)
    } catch (parseError) {
      throw new Error(
        `Failed to parse JSON response: ${(parseError as Error).message}`,
      )
    }

    console.log(`Commits: ${JSON.stringify(commits)}`)

    // const commits = await response.json()
    const formattedCommits = commits.map((commit: any) => {
      const status = commit.commit.verification && commit.commit.verification.verified ? 'Verified' : 'Unverified'

      return {
        commit: commit.commit.message,
        branch: commit.commit.tree.sha,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        status: status,
        actions: ['View', 'Github', 'Notebook'],
        avatar_url: commit.committer
          ? commit.committer.avatar_url
          : 'https://github.com/identicons/default.png', // Include the avatar URL
      }
    })

    res.status(200).json(formattedCommits)
  } catch (error: any) {
    console.error(error.message)
    res.status(500).json({ error: error.message })
  }
}
