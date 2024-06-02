import { NextApiRequest, NextApiResponse } from "next";
import { NotionSync } from "../../../../api/src/notionSync";
const notionSync = new NotionSync();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { action } = req.query;
  const { username, orgName, repoName, branchName, commit, commitMessage } =
    req.body;

  try {
    switch (method) {
      case "GET":
        if (
          action === "fetchRepoBranches" &&
          typeof orgName === "string" &&
          typeof repoName === "string"
        ) {
          const branches = await notionSync.fetchRepoBranches(
            orgName,
            repoName
          );
          res.status(200).json({ branches });
        } else if (
          action === "fetchCommitsForUserInRepo" &&
          typeof orgName === "string" &&
          typeof repoName === "string" &&
          typeof branchName === "string"
        ) {
          const commits = await notionSync.fetchCommitsForUserInRepo(
            orgName,
            repoName,
            branchName
          );
          res.status(200).json({ commits });
        } else {
          res.status(400).json({ error: "Invalid query parameters" });
        }
        break;
      case "POST":
        if (action === "addCommitToNotion") {
          if (
            typeof commit === "string" &&
            typeof commitMessage === "string" &&
            typeof branchName === "string"
          ) {
            await notionSync.addCommitToNotion(
              commit,
              commitMessage,
              branchName
            );
            res
              .status(200)
              .json({ message: "Commit added to Notion successfully" });
          } else {
            res.status(400).json({ error: "Invalid request body" });
          }
        } else if (action === "sync") {
          if (typeof username === "string") {
            const result = await notionSync.sync();
            res.status(200).json({ message: result });
          } else {
            res.status(400).json({ error: "Username is required for sync" });
          }
        } else {
          res.status(400).json({ error: "Invalid action" });
        }
        break;
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
