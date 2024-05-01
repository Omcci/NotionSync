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
        pageId: page.id,
        commitId,
      };
    });

    allCommits.push(...commits);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }
  console.log(
    "All commits fetched:",
    allCommits.map((commit) => commit.commitId)
  );

  return allCommits;
};

const deleteDuplicateCommits = async () => {
  const allCommits = await fetchAllCommitFromNotion();
  const counts = {};

  allCommits.forEach(({ commitId, pageId }) => {
    if (counts[commitId]) {
      counts[commitId].count++;
      counts[commitId].pages.push(pageId);
    } else {
      counts[commitId] = { count: 1, pages: [pageId] };
    }
  });

  const duplicateCommitIds = Object.keys(counts).filter(
    (id) => counts[id].count > 1
  );
  console.log("Total commits:", allCommits.length);
  console.log("Unique commits:", Object.keys(counts).length);
  console.log("Duplicate commits:", duplicateCommitIds.length);

  for (const commitId of duplicateCommitIds) {
    const pages = counts[commitId].pages;
    for (let i = 1; i < pages.length; i++) {
      await notion.pages.update({
        page_id: pages[i],
        archived: true,
      });
    }
  }
  console.log(
    "Deleted duplicate commits, number of commits deleted:",
    duplicateCommitIds.length
  );
};

await fetchAllCommitFromNotion();
await deleteDuplicateCommits();
