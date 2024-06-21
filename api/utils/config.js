import dotenv from 'dotenv'
dotenv.config()

const config = {
  githubToken: process.env.GITHUB_TOKEN,
  notionToken: process.env.NOTION_TOKEN,
  databaseId: process.env.NOTION_DATABASE_ID,
  orgName: process.env.ORG_NAME,
  repoName: process.env.REPO_NAME,
  mistralToken: process.env.MISTRAL_TOKEN,
  startDate: process.env.START_DATE,
  endDate: process.env.END_DATE,
}

export const {
  githubToken,
  notionToken,
  databaseId,
  orgName,
  repoName,
  mistralToken,
  startDate,
  endDate,
} = config
