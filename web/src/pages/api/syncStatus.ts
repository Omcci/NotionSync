import { NextApiRequest, NextApiResponse } from 'next'

let syncStatus = {
  lastSyncDate: null,
  errorBranch: null,
  statusMessage: 'No sync performed yet',
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { lastSyncDate, errorBranch, statusMessage } = req.body

    syncStatus = {
      lastSyncDate: lastSyncDate || syncStatus.lastSyncDate,
      errorBranch: errorBranch || syncStatus.errorBranch,
      statusMessage: statusMessage || syncStatus.statusMessage,
    }

    res
      .status(200)
      .json({ message: 'Sync status updated successfully', syncStatus })
  } else if (req.method === 'GET') {
    res.status(200).json(syncStatus)
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
