import { NextApiRequest, NextApiResponse } from 'next'
import { validateSession } from '@/lib/session'

/**
 * Get current session
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get token from Authorization header or query param
    const authHeader = req.headers.authorization
    const token =
      authHeader?.replace('Bearer ', '') || (req.query.token as string)

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const { user, session } = await validateSession(token)

    if (!user || !session) {
      return res.status(401).json({ message: 'Invalid or expired session' })
    }

    return res.status(200).json({
      user,
      session: {
        id: session.id,
        expires_at: session.expires_at,
      },
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
