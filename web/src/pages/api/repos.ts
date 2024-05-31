import type { NextApiRequest, NextApiResponse } from "next";
import { NotionSync } from "../../../../api/src/notionSync";

type Response = {
  repos?: string[];
  branches?: { [repo: string]: string[] };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method === "GET") {
    const { username, githubToken } = req.query;

    if (!username || typeof username !== "string") {
      res.status(400).json({ error: "Invalid or missing username" });
      return;
    }

    if (!githubToken || typeof githubToken !== "string") {
      res.status(400).json({ error: "Invalid or missing GitHub token" });
      return;
    }

    const notionSync = new NotionSync();

    try {
      const repos = await notionSync.fetchUserRepos(username);
      const branches: { [repo: string]: string[] } = {};

      for (const repo of repos) {
        const branchList = await notionSync.fetchRepoBranches(
          username,
          repo,
          githubToken
        );
        branches[repo] = branchList;
      }
      res.status(200).json({ repos, branches });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(500).json({ error: errorMessage });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
