import { NotionSync } from "./src/notionSync.js";
import dotenv from "dotenv";
dotenv.config();
const githubToken = process.env.GITHUB_TOKEN;
export const notionToken = process.env.NOTION_TOKEN;
export const databaseId = process.env.NOTION_DATABASE_ID;
const orgName = process.env.ORG_NAME;
const repoName = process.env.REPO_NAME;
const mistralToken = process.env.MISTRAL_TOKEN;
const startDate = process.env.START_DATE;
const endDate = process.env.END_DATE;
const notionSync = new NotionSync(
  githubToken,
  notionToken,
  databaseId,
  orgName,
  repoName,
  mistralToken,
  startDate,
  endDate
);

const app = async () => {
  await notionSync.main();
  console.log("Sync complete 🚀");
};

app();
