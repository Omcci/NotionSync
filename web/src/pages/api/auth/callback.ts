import { NextApiRequest, NextApiResponse } from 'next'
import { createSession } from '@/lib/session'
import { UserService, GitHubUserData } from '@/services/userService'

/**
 * Handle GitHub OAuth callback
 * Exchange code for access token and create session
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { code, state, error, error_description } = req.query

  // Check for OAuth errors
  if (error) {
    const errorMsg = Array.isArray(error_description) 
      ? error_description[0] 
      : (error_description || (Array.isArray(error) ? error[0] : error))
    return res.redirect(
      `/login?error=${encodeURIComponent(errorMsg as string)}`
    )
  }

  const codeValue = Array.isArray(code) ? code[0] : code
  const stateValue = Array.isArray(state) ? state[0] : state

  if (!codeValue || !stateValue) {
    return res.redirect('/login?error=missing_code_or_state')
  }

  try {
    // Exchange code for access token
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('GitHub OAuth credentials not configured')
      return res.redirect('/login?error=oauth_not_configured')
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: codeValue,
          state: stateValue,
        }),
      }
    )

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return res.redirect(
        `/login?error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
      )
    }

    const accessToken = tokenData.access_token

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user from GitHub')
    }

    const githubUser = await userResponse.json()

    // Get user email (may require additional scope)
    let email = githubUser.email
    if (!email) {
      try {
        const emailResponse = await fetch(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        )
        if (emailResponse.ok) {
          const emails = await emailResponse.json()
          const primaryEmail = emails.find((e: any) => e.primary)
          email = primaryEmail?.email || emails[0]?.email
        }
      } catch (e) {
        console.warn('Failed to fetch user email:', e)
      }
    }

    // Create or update user in database
    const userData: GitHubUserData = {
      id: githubUser.id.toString(), // GitHub ID as string
      email: email || null,
      github_username: githubUser.login,
      full_name: githubUser.name || null,
      avatar_url: githubUser.avatar_url || null,
      user_metadata: {
        user_name: githubUser.login,
        preferred_username: githubUser.login,
        full_name: githubUser.name,
        name: githubUser.name,
        avatar_url: githubUser.avatar_url,
        email: email,
      },
    }

    const user = await UserService.syncUserWithDatabase(userData)

    // Store GitHub token
    await UserService.storeGitHubToken(
      user.id,
      accessToken,
      tokenData.refresh_token
    )

    // Create session
    const userAgent = req.headers['user-agent']
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const { session, token } = await createSession(
      user.id,
      userAgent,
      ipAddress as string
    )

    // Redirect to dashboard with session token
    // Store token in a secure cookie or return it in the redirect
    const redirectUrl = new URL(
      '/auth/callback',
      req.headers.origin || 'http://localhost:9001'
    )
    redirectUrl.searchParams.set('token', token)
    redirectUrl.searchParams.set('success', 'true')

    return res.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('OAuth callback error:', error)
    return res.redirect(
      `/login?error=${encodeURIComponent(
        error instanceof Error ? error.message : 'Authentication failed'
      )}`
    )
  }
}
