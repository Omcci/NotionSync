import type { NextApiRequest, NextApiResponse } from "next";
import { NotionSync } from "../../../../api/src/notionSync";

type ReposResponse = {
  repos?: string[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReposResponse>
) {
  if (req.method === "GET") {
    const { username } = req.query;

    if (!username || typeof username !== "string") {
      res.status(400).json({ error: "Invalid or missing username" });
      return;
    }

    const notionSync = new NotionSync();

    try {
      const repos = await notionSync.fetchUserRepos(username);
      res.status(200).json({ repos });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(500).json({ error: errorMessage });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
