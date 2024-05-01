import dotenv from "dotenv";
dotenv.config();

export const githubToken = process.env.GITHUB_TOKEN;
export const notionToken = process.env.NOTION_TOKEN;
export const databaseId = process.env.NOTION_DATABASE_ID;
export const orgName = process.env.ORG_NAME;
export const repoName = process.env.REPO_NAME;
export const mistralToken = process.env.MISTRAL_TOKEN;
export const startDate = process.env.START_DATE;
export const endDate = process.env.END_DATE;
