import { NextApiRequest, NextApiResponse } from 'next'
import { Client } from '@notionhq/client'
import Error from 'next/error'
import { fetchRepoBranches } from './branches'
import { fetchCommitsForUserInRepo } from './commits'
import { addCommitToNotion, commitExistsInNotion } from './notion'
import { SyncStatus } from '../../../types/types'

const githubToken = process.env.GITHUB_TOKEN
const notionToken = process.env.NOTION_TOKEN
const databaseId = process.env.NOTION_DATABASE_ID
const orgName = process.env.ORG_NAME
const repoName = process.env.REPO_NAME
const mistralToken = process.env.MISTRAL_TOKEN
const startDate = process.env.START_DATE
const endDate = process.env.END_DATE

const notion = new Client({ auth: notionToken })

let syncStatus: SyncStatus = {
  lastSyncDate: null,
  errorBranch: null,
  statusMessage: 'No sync performed yet',
}

async function sync() {
  console.log('Starting sync process...')
  const branches = await fetchRepoBranches(
    githubToken!,
    orgName!,
    repoName!,
    100,
    1,
  )
  for (const branch of branches) {
    try {
      console.log(`Syncing branch: ${branch}`)

      const page = '1'
      const per_page = '100'
      const { commits } = await fetchCommitsForUserInRepo(
        githubToken!,
        orgName!,
        repoName!,
        page,
        per_page,
      )

      console.log(`Fetched ${commits.length} commits for branch: ${branch}`)

      for (const commit of commits) {
        const commitSha = commit.sha
        if (await commitExistsInNotion(notion, databaseId!, commitSha)) {
          console.log(`Commit ${commitSha} already exists in Notion. Skipping.`)
          continue
        }
        const commitMessage = commit.commit.message
        console.log(
          `Adding commit ${commitSha} with message: "${commitMessage}" to Notion`,
        )

        await addCommitToNotion(
          commit,
          commitMessage,
          notionToken!,
          databaseId!,
          repoName!,
          branch,
        )
        // console.log(`Commit ${commitSha} added to Notion successfully`)
      }
    } catch (error: any) {
      const errorMessage = error.message
      console.error(`Error syncing branch ${branch}: ${errorMessage}`)
      syncStatus = {
        lastSyncDate: new Date(),
        errorBranch: branch,
        statusMessage: `Error syncing branch '${branch}': ${errorMessage}`,
      }
      throw new Error({
        branchName: branch,
        message: errorMessage,
        statusCode: 500,
      } as any)
    }
    syncStatus = {
      lastSyncDate: new Date(),
      errorBranch: '',
      statusMessage: 'Sync process completed',
    }
  }
  return 'Sync process completed'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req
  const { action } = req.query

  try {
    switch (method) {
      case 'GET':
        res
          .status(400)
          .json({ error: 'GET method not supported for this route' })
        break
      case 'POST':
        if (action === 'sync') {
          const result = await sync()
          res.status(200).json({ message: result })
        } else {
          res.status(400).json({ error: 'Invalid action' })
        }
        break
      default:
        res.setHeader('Allow', ['POST'])
        res.status(405).end(`Method ${method} Not Allowed`)
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
