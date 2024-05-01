import fetch from "node-fetch";
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}
import { mistral_prompt } from "../utils/prompts.js";
import MistralClient from "@mistralai/mistralai";
import { Client } from "@notionhq/client";
import {
  githubToken,
  notionToken,
  mistralToken,
  databaseId,
  orgName,
  repoName,
  startDate,
  endDate,
} from "../utils/config.js";

//TODO: Add a front-end

export class NotionSync {
  constructor() {
    this.client = new MistralClient(mistralToken);
    this.notion = new Client({ auth: notionToken });
  }

  async fetchRepoBranches(githubToken, orgName, repoName) {
    const url = `https://api.github.com/repos/${orgName}/${repoName}/branches`;
    try {
      const response = await fetch(url, {
        headers: { Authorization: `token ${githubToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          `Error fetching branches for ${repoName}: ${response.status}`
        );
      }
      return data.map((branch) => branch.name);
    } catch (error) {
      console.error(error.message);
      return [];
    }
  }

  async fetchCommitsForUserInRepo(githubToken, orgName, repoName, branchName) {
    const url = `https://api.github.com/repos/${orgName}/${repoName}/commits?sha=${branchName}&author=Omcci&since=${startDate}&until=${endDate}`;
    try {
      const response = await fetch(url, {
        headers: { Authorization: `token ${githubToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          `Error retrieving commits for ${repoName} on branch ${branchName}: ${response.status}`
        );
      }
      return data;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  }

  async fetchCommitDiff(commitSha) {
    const url = `https://api.github.com/repos/${orgName}/${repoName}/commits/${commitSha}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3.diff",
        },
      });
      if (!response.ok) {
        throw new Error(
          `Error retrieving commit diff for ${repoName} on commit ${commitSha}: ${response.status}`
        );
      }
      return await response.text();
    } catch (error) {
      console.error(error.message);
      return null;
    }
  }

  async commitExistsInNotion(commitSha) {
    try {
      const response = await this.notion.databases.query({
        database_id: databaseId,
        filter: {
          property: "Commit ID",
          rich_text: {
            equals: commitSha,
          },
        },
      });
      return [response.results.length > 0, response.results];
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return [false, []];
    }
  }

  async addCommitToNotion(
    commit,
    commitMessage,
    notionToken,
    databaseId,
    repoName,
    branchName,
    mistralToken
  ) {
    const commitDiff = await this.fetchCommitDiff(commit.sha);
    if (!commitDiff) {
      console.error(`Could not fetch diff for commit ${commit.sha}. Skipping.`);
      return;
    }

    let summaryWithTokenCount = await this.summarizeCommitWithMistral(
      commitMessage,
      commitDiff
    );
    try {
      const response = await this.notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          "Commit ID": {
            rich_text: [
              {
                type: "text",
                text: {
                  content: commit.sha,
                },
              },
            ],
          },
          Name: {
            title: [
              {
                type: "text",
                text: {
                  content: summaryWithTokenCount,
                },
              },
            ],
          },
          Date: {
            date: {
              start: commit.commit.author.date,
            },
          },
          Repository: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: repoName,
                },
              },
            ],
          },
          Branch: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: branchName,
                },
              },
            ],
          },
        },
      });
      console.log(`Commit added to Notion successfully: ${commit.sha}`);
    } catch (error) {
      console.error(`Failed to add commit to Notion: ${error.message}`);
    }
  }

  async summarizeCommitWithMistral(commitMessage, diff) {
    const filteredDiffLines = [];
    let skipCurrentFile = false;

    diff.split("\n").forEach((line) => {
      if (line.startsWith("diff --git")) {
        skipCurrentFile = line.includes(".svg");
      }
      if (!skipCurrentFile) {
        filteredDiffLines.push(line);
      }
    });

    const filteredDiff = filteredDiffLines.join("\n");
    const prompt = mistral_prompt(commitMessage, filteredDiff);

    try {
      const chatResponse = await this.client.chat({
        model: "open-mistral-7b",
        messages: [{ role: "user", content: prompt }],
      });

      if (chatResponse.choices && chatResponse.choices.length > 0) {
        const summary = chatResponse.choices[0].message.content;
        const tokenCount = Math.ceil(summary.length / 3);
        return `${summary}\n\nToken count: ${tokenCount}`;
      } else {
        return "No summary available";
      }
    } catch (error) {
      console.error("Error making API request:", error);
      return "Failed to generate summary";
    }
  }
  async main() {
    console.log("Starting sync process...");
    const branchNames = await this.fetchRepoBranches(
      githubToken,
      orgName,
      repoName
    );
    for (let branchName of branchNames) {
      const commits = await this.fetchCommitsForUserInRepo(
        githubToken,
        orgName,
        repoName,
        branchName
      );
      for (let commit of commits) {
        const commitSha = commit.sha;
        const [exists, _] = await this.commitExistsInNotion(commitSha);
        if (exists) {
          console.log(
            `Commit ${commitSha} already exists in Notion. Skipping.`
          );
          continue;
        }
        const commitMessage = commit.commit.message;
        await this.addCommitToNotion(
          commit,
          commitMessage,
          notionToken,
          databaseId,
          repoName,
          branchName,
          mistralToken
        );
      }
    }
  }
}
