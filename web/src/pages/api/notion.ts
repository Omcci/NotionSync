import { Client } from '@notionhq/client'
import { mistral_prompt } from './prompt'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const mistralToken = process.env.MISTRAL_TOKEN

export const addCommitToNotion = async (
  commit: string,
  commitMessage: string,
  notionToken: string,
  databaseId: string,
  repoName: string,
  branchName: string,
) => {
  const commitDiff = await fetchCommitDiff(commit)
  if (!commitDiff) {
    console.error(`Could not fetch diff for commit ${commit}. Skipping.`)
    return
  }

  let summaryWithTokenCount = await summarizeCommitWithMistral(
    commitMessage,
    commitDiff,
  )

  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Commit ID': {
          rich_text: [
            {
              type: 'text',
              text: {
                content: commit,
              },
            },
          ],
        },
        Name: {
          title: [
            {
              type: 'text',
              text: {
                content: summaryWithTokenCount,
              },
            },
          ],
        },
        Date: {
          date: {
            start: new Date().toISOString(),
          },
        },
        Repository: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: repoName,
              },
            },
          ],
        },
        Branch: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: branchName,
              },
            },
          ],
        },
      },
    })
    console.log(`Commit added to Notion successfully: ${commit}`)
  } catch (error) {
    console.error(`Failed to add commit to Notion: ${(error as Error).message}`)
  }
}

const fetchCommitDiff = async (commitSha: string) => {
  const orgName = process.env.ORG_NAME
  const repoName = process.env.REPO_NAME
  const url = `https://api.github.com/repos/${orgName}/${repoName}/commits/${commitSha}`
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.diff',
      },
    })
    if (!response.ok) {
      throw new Error(
        `Error retrieving commit diff for ${process.env.REPO_NAME} on commit ${commitSha}: ${response.status}`,
      )
    }
    return await response.text()
  } catch (error) {
    console.error((error as Error).message)
    return null
  }
}

const summarizeCommitWithMistral = async (
  commitMessage: string,
  diff: string,
) => {
  const filteredDiffLines: string[] = []
  let skipCurrentFile = false

  diff.split('\n').forEach((line) => {
    if (line.startsWith('diff --git')) {
      skipCurrentFile = line.includes('.svg')
    }
    if (!skipCurrentFile) {
      filteredDiffLines.push(line)
    }
  })

  const filteredDiff = filteredDiffLines.join('\n')
  const prompt = mistral_prompt(commitMessage, filteredDiff)

  try {
    const response = await fetch('https://api.mistral.com/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mistralToken}`,
      },
      body: JSON.stringify({
        model: 'open-mistral-7b',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const chatResponse = await response.json()

    if (chatResponse.choices && chatResponse.choices.length > 0) {
      const summary = chatResponse.choices[0].message.content
      const tokenCount = Math.ceil(summary.length / 3)
      return `${summary}\n\nToken count: ${tokenCount}`
    } else {
      return 'No summary available'
    }
  } catch (error) {
    console.error('Error making API request:', error)
    return 'Failed to generate summary'
  }
}
