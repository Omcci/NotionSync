import { NextApiRequest, NextApiResponse } from "next";

type SyncResponse = {
  message: string;
  details?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SyncResponse>
) {
  if (req.method === "GET") {
    res.status(200).json({ message: "Connection successful!" });
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
