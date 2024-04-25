import fetch from "node-fetch";
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}
import { mistral_prompt } from "../prompts.js";
import MistralClient from "@mistralai/mistralai";
import { Client } from "@notionhq/client";

export class NotionSync {
  constructor(
    githubToken,
    notionToken,
    databaseId,
    orgName,
    repoName,
    mistralToken
  ) {
    this.githubToken = githubToken;
    this.notionToken = notionToken;
    this.databaseId = databaseId;
    this.orgName = orgName;
    this.repoName = repoName;
    this.mistralToken = mistralToken;
    this.client = new MistralClient(this.mistralToken);
    this.notion = new Client({ auth: this.notionToken });
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
    const url = `https://api.github.com/repos/${orgName}/${repoName}/commits?sha=${branchName}&author=Omcci`;
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
    const url = `https://api.github.com/repos/${this.orgName}/${this.repoName}/commits/${commitSha}`;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `token ${this.githubToken}`,
          Accept: "application/vnd.github.v3.diff",
        },
      });
      if (!response.ok) {
        throw new Error(
          `Error retrieving commit diff for ${this.repoName} on commit ${commitSha}: ${response.status}`
        );
      }
      return await response.text();
    } catch (error) {
      console.error(error.message);
      return null;
    }
  }

  async commitExistsInNotion(commitSha) {
    const url = `https://api.notion.com/v1/databases/${this.databaseId}/query`;
  //   const headers = {
  //     "Authorization": `Bearer ${this.notionToken}`,
  //     "Content-Type": "application/json",
  //     "Notion-Version": "2022-06-28"
  // };
  // const body = JSON.stringify({
  //     filter: {
  //         property: "Commit ID",
  //         text: {
  //             equals: commitSha
  //         }
  //     }
  // });
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
            property: 'Commit ID',
            text: {
                equals: commitSha
            }
        }
    });
      if (!response.ok) {
        throw new Error(
          `Error querying Notion database: ${response.statusText}`
        );
      }
      return [data.results.length > 0, data.results];
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

    const url = "https://api.notion.com/v1/pages";
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            "Commit ID": { "rich_text": [{ "text": { "content": commit.sha } }] },
            "Name": { "title": [{ "text": { "content": summaryWithTokenCount } }] },
            "Date": { "date": { "start": commit.commit.author.date } },
            "Repository": { "rich_text": [{ "text": { "content": repoName } }] },
            "Branch": { "rich_text": [{ "text": { "content": branchName } }] },
          },
        }),
      });
      if (!response.ok) {
        throw new Error(
          `Error adding commit to Notion: ${
            response.status
          }, Response: ${await response.text()}`
        );
      }
      console.log(`Commit added to Notion successfully: ${commit.sha}`);
    } catch (error) {
      console.error(error.message);
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
    // const url = "https://api.mistral.ai/summarize";
    const payload = {
      model: "open-mistral-7b",
      messages: [{ role: "user", content: prompt }],
    };

    try {
      const chatResponse = await this.client.chat({
        model: "open-mistral-7b",
        messages: [{ role: "user", content: prompt }],
      });

      if (chatResponse.choices && chatResponse.choices.length > 0) {
          const summary = chatResponse.choices[0].message.content;
          const tokenCount = Math.ceil(summary.length / 3); // Assuming token count is calculated this way
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
      this.githubToken,
      this.orgName,
      this.repoName
    );
    for (let branchName of branchNames) {
      const commits = await this.fetchCommitsForUserInRepo(
        this.githubToken,
        this.orgName,
        this.repoName,
        branchName
      );
      for (let commit of commits) {
        const commitSha = commit.sha;
        const [exists, _] = await this.commitExistsInNotion(
          commitSha,
        );
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
          this.notionToken,
          this.databaseId,
          this.repoName,
          branchName,
          this.mistralToken
        );
      }
    }
  }
}
