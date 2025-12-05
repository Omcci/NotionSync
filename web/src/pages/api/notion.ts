import { Client } from '@notionhq/client'
import { mistral_prompt } from './prompt'
import { Mistral } from '@mistralai/mistralai'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const mistralToken = process.env.MISTRAL_TOKEN
const client = new Mistral({ apiKey: mistralToken })

export const addCommitToNotion = async (
  commit: string,
  commitMessage: string,
  notionToken: string,
  databaseId: string,
  repoName: string,
  branchName: string
) => {
  const commitDiff = await fetchCommitDiff(commit)
  if (!commitDiff) {
    return
  }

  let summaryWithTokenCount = await summarizeCommitWithMistral(
    commitMessage,
    commitDiff
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
  } catch (error) {}
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
        `Error retrieving commit diff for ${process.env.REPO_NAME} on commit ${commitSha}: ${response.status}`
      )
    }
    return await response.text()
  } catch (error) {
    return null
  }
}

export const commitExistsInNotion = async (
  notion: Client,
  databaseId: string,
  commitSha: string
) => {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Commit ID',
        rich_text: {
          equals: commitSha,
        },
      },
    })
    return response.results.length > 0
  } catch (error) {
    return false
  }
}

const summarizeCommitWithMistral = async (
  commitMessage: string,
  diff: string
) => {
  const filteredDiffLines: string[] = []
  let skipCurrentFile = false

  diff.split('\n').forEach(line => {
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
    const chatResponse = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 1000,
    })

    if (chatResponse.choices && chatResponse.choices.length > 0) {
      const summary = chatResponse.choices[0].message.content
      if (summary) {
        const tokenCount = Math.ceil(summary.length / 3)
        return `${summary}\n\nToken count: ${tokenCount}`
      }
    }
    return 'No summary available'
  } catch (error) {
    return 'Failed to generate summary'
  }
}
