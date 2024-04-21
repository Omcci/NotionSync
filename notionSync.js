//Convert NotionSync.py to JS

require('dotenv').config();
const axios = require('axios');

const githubToken = process.env.GITHUB_TOKEN;
const notionToken = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;
const orgName = process.env.ORG_NAME;
const repoName = process.env.REPO_NAME;
const mistralToken = process.env.MISTRAL_TOKEN;

async function summarizeCommitWithMistral(commitMessage, diff, mistralToken) {
    const filteredDiffLines = [];
    let skipCurrentFile = false;

    diff.split("\n").forEach(line => {
        if (line.startsWith("diff --git") && line.includes(".svg")) {
            skipCurrentFile = true;
        }
        if (!skipCurrentFile) {
            filteredDiffLines.push(line);
        }
        if (line === "---") { 
            skipCurrentFile = false;
        }
    });

    try {
        const response = await axios.post('https://api.mistral.ai/summarize', {
            message: commitMessage,
            diff: filteredDiffLines.join("\n")
        }, {
            headers: { 'Authorization': `Bearer ${mistralToken}` }
        });
        return response.data;
    } catch (error) {
        console.error('Error making API request:', error);
        return null;
    }
}
