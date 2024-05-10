import type { NextApiRequest, NextApiResponse } from "next";
import { NotionSync } from "../../../../api/src/notionSync";
import { config } from "../../../../api/utils/config";

type SyncResponse = {
  message: string;
  details?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SyncResponse>
) {
  if (req.method === "POST") {
    const notionSync = new NotionSync(config);

    try {
      const result = await notionSync.main();
      res
        .status(200)
        .json({ message: "Sync completed successfully", details: result });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(500).json({ message: "Sync failed", details: errorMessage });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// async function startSync(): Promise<string> {
//   return "Sync completed";
// }
