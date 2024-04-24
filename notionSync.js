class NotionSync {
    constructor(githubToken, notionToken, databaseId, orgName, repoName, mistralToken) {
        this.githubToken = githubToken;
        this.notionToken = notionToken;
        this.databaseId = databaseId;
        this.orgName = orgName;
        this.repoName = repoName;
        this.mistralToken = mistralToken;
    }

    async fetchRepoBranches() {
        const url = `https://api.github.com/repos/${orgName}/${repoName}/branches`;
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `token ${githubToken}` }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`Error fetching branches for ${repoName}: ${response.status}`);
            }
            return data.map(branch => branch.name);
        } catch (error) {
            console.error(error.message);
            return [];
        }
    };

    async fetchCommitsForUserInRepo() {
        const url = `https://api.github.com/repos/${orgName}/${repoName}/commits?sha=${branchName}&author=Omcci`;
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `token ${githubToken}` }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`Error retrieving commits for ${repoName} on branch ${branchName}: ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(error.message);
            return [];
        }
    };

    async fetchCommitDiff() {
        const url = `https://api.github.com/repos/${orgName}/${repoName}/commits/${commitSha}`;
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3.diff'
                }
            });
            if (!response.ok) {
                throw new Error(`Error retrieving commit diff for ${repoName} on commit ${commitSha}: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error(error.message);
            return null;
        }
    };

    async commitExistsInNotion() {
        const url = `https://api.notion.com/v1/databases/${databaseId}/query`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${notionToken}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                },
                body: JSON.stringify({
                    filter: { "property": "Commit ID", "text": { "equals": commitSha } }
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`Error querying Notion database: ${response.statusText}`);
            }
            return [data.results.length > 0, data.results];
        } catch (error) {
            console.error(error.message);
            return [false, []];
        }
    };

    async addCommitToNotion() {
        const commitDiff = await fetchCommitDiff(githubToken, orgName, repoName, commit.sha);
        if (!commitDiff) {
            console.error(`Could not fetch diff for commit ${commit.sha}. Skipping.`);
            return;
        }

        let summaryWithTokenCount = commitMessage;

        const url = "https://api.notion.com/v1/pages";
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${notionToken}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                },
                body: JSON.stringify({
                    parent: { "database_id": databaseId },
                    properties: {
                        "Commit ID": { "rich_text": [{ "text": { "content": commit.sha } }] },
                        "Name": { "title": [{ "text": { "content": summaryWithTokenCount } }] },
                        "Date": { "date": { "start": commit.commit.author.date } },
                        "Repository": { "rich_text": [{ "text": { "content": repoName } }] },
                        "Branch": { "rich_text": [{ "text": { "content": branchName } }] }
                    }
                })
            });
            if (!response.ok) {
                throw new Error(`Error adding commit to Notion: ${response.status}, Response: ${await response.text()}`);
            }
            console.log(`Commit added to Notion successfully: ${commit.sha}`);
        } catch (error) {
            console.error(error.message);
        }
    };

    async main() {
        const branchNames = await fetchRepoBranches(githubToken, orgName, repoName);
        for (let branchName of branchNames) {
            const commits = await fetchCommitsForUserInRepo(githubToken, orgName, repoName, branchName);
            for (let commit of commits) {
                const commitSha = commit.sha;
                const [exists, _] = await commitExistsInNotion(commitSha, notionToken, databaseId);
                if (exists) {
                    console.log(`Commit ${commitSha} already exists in Notion. Skipping.`);
                    continue;
                }
                const commitMessage = commit.commit.message;
                await addCommitToNotion(commit, commitMessage, notionToken, databaseId, repoName, branchName, mistralToken);
            }
        }
    };
}