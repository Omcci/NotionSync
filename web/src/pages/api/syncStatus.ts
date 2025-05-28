import { NextApiRequest, NextApiResponse } from 'next'

let syncStatus = {
  lastSyncDate: null,
  errorBranch: null,
  statusMessage: 'No sync performed yet',
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(syncStatus)
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
