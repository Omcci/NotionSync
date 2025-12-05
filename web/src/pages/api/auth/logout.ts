import { NextApiRequest, NextApiResponse } from 'next'
import { deleteSession } from '@/lib/session'

/**
 * Logout - delete session
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ message: 'Token required' })
    }

    await deleteSession(token)

    return res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error logging out:', error)
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

