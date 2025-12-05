import { NextApiRequest, NextApiResponse } from 'next'
import { validateSession } from '@/lib/session'
import { UserService } from '@/services/userService'

/**
 * Get GitHub token for current user
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return res.status(401).json({ message: 'No session token provided' })
    }

    // Validate session
    const { user } = await validateSession(sessionToken)

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired session' })
    }

    // Get GitHub token from database
    const githubToken = await UserService.getGitHubToken(user.id)

    if (!githubToken) {
      return res.status(401).json({
        message: 'No GitHub token found. Please re-authenticate.',
      })
    }

    return res.status(200).json({ token: githubToken })
  } catch (error) {
    console.error('Error getting GitHub token:', error)
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
