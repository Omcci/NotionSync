import { Client } from "@notionhq/client";
import { notionToken, databaseId } from "./index.js";

const notion = new Client({ auth: notionToken });

const fetchAllCommitFromNotion = async () => {
  let allCommits = [];
  let hasMore = true;
  let startCursor = undefined;

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: startCursor,
    });

    const commits = response.results.map((page) => {
      const commitId =
        page.properties["Commit ID"] &&
        page.properties["Commit ID"].rich_text.length > 0
          ? page.properties["Commit ID"].rich_text[0].plain_text
          : "No Commit ID";

      return {
        pageId: page.id, // This is the ID of the Notion page
        commitId, // This is the actual Commit ID from your repository
      };
    });

    allCommits.push(...commits);
    // console.log(
    //   "Fetched",
    //   commits.length,
    //   "commits; Total:",
    //   allCommits.length
    // );

    // Update the cursor and hasMore for the next iteration
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }

  console.log(
    "All commits fetched:",
    allCommits.map((commit) => commit.commitId)
  );

  //   console.log(
  //     "Total commits fetched:",
  //     allCommits.length,
  //     "IDs",
  //     allCommits.map((commit) => commit.id)
  //   );
  return allCommits;
};

const deleteDuplicateCommits = async () => {
  const allCommits = await fetchAllCommitFromNotion();
  const commitIds = allCommits.map((commit) => commit.commitId);

  // Using an object to count occurrences
  const counts = {};
  commitIds.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
  });

  // Filter out commit IDs where count is more than 1 to find duplicates
  const duplicateCommitIds = Object.keys(counts).filter((id) => counts[id] > 1);
  console.log("Total commits:", commitIds.length);
  console.log("Unique commits:", commitIds.length - duplicateCommitIds.length);
  console.log("Duplicate commits:", duplicateCommitIds.length); // for (const commitId of duplicateCommitIds) {
  //     await notion.pages.update({
  //         page_id: commitId,
  //         archived: true,
  //     });
  // }
};

await fetchAllCommitFromNotion();
await deleteDuplicateCommits();
