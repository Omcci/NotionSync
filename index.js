import { NotionSync } from './src/notionSync.js';
import dotenv from 'dotenv';
dotenv.config();

const app = async () => {
    const githubToken = process.env.GITHUB_TOKEN;
    const notionToken = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;
    const orgName = process.env.ORG_NAME;
    const repoName = process.env.REPO_NAME;
    const mistralToken = process.env.MISTRAL_TOKEN;
    const notionSync = new NotionSync(githubToken, notionToken, databaseId, orgName, repoName, mistralToken);
    await notionSync.main();
    console.log('Sync complete 🚀');
}

app();