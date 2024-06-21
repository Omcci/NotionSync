// export const config = {
//     apiUrl: "/api", // Assuming you are calling an internal API
//   };

import { NextApiRequest, NextApiResponse } from 'next'

let config = {
  repository: 'Repository',
  organization: 'Organization',
  githubToken: '*****',
  notionToken: '*****',
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(config)
  } else if (req.method === 'POST') {
    config = { ...config, ...req.body }
    res.status(200).json({ message: 'Config updated successfully' })
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
