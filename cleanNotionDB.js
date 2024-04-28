import { Client } from "@notionhq/client";
import { notionToken, databaseId } from "./index.js";

const notion = new Client({ auth: notionToken });
console.log("notion", notionToken);

export const fetchAllCommitFromNotion = async () => {
  const response = await notion.databases.query({
    database_id: databaseId,
  });
  console.log("databaseId", databaseId);
  console.log("RESPONSE", response);
//   return response;
};

fetchAllCommitFromNotion();
