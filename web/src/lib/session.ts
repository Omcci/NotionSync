import { query } from './db'
import { randomBytes, createHash } from 'crypto'

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
  user_agent?: string
  ip_address?: string
}

export interface SessionUser {
  id: string
  email: string | null
  github_username: string | null
  full_name: string | null
  avatar_url: string | null
  isPremium: boolean
  onboarding_completed: boolean
}

/**
 * Create a new session for a user
 */
export const createSession = async (
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ session: Session; token: string }> => {
  // Generate a secure random token
  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')

  // Session expires in 30 days
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const result = await query<{
    id: string
    user_id: string
    expires_at: Date
    created_at: Date
    user_agent: string | null
    ip_address: string | null
  }>(
    `INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, expires_at, created_at, user_agent, ip_address`,
    [userId, tokenHash, expiresAt, userAgent || null, ipAddress || null]
  )

  const dbSession = result.rows[0]
  return {
    session: {
      id: dbSession.id,
      user_id: dbSession.user_id,
      token: token, // Return the plain token, not the hash
      expires_at: dbSession.expires_at,
      created_at: dbSession.created_at,
      user_agent: dbSession.user_agent ?? undefined,
      ip_address: dbSession.ip_address ?? undefined,
    },
    token,
  }
}

/**
 * Validate a session token and return the user
 */
export const validateSession = async (
  token: string
): Promise<{ user: SessionUser | null; session: Session | null }> => {
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const result = await query<{
    id: string
    user_id: string
    expires_at: Date
    created_at: Date
    user_agent: string | null
    ip_address: string | null
    email: string | null
    github_username: string | null
    full_name: string | null
    avatar_url: string | null
    isPremium: boolean
    onboarding_completed: boolean
  }>(
    `SELECT s.id, s.user_id, s.expires_at, s.created_at, s.user_agent, s.ip_address,
            u.id as user_id, u.email, u.github_username, u.full_name, u.avatar_url, u."isPremium", u.onboarding_completed
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  )

  if (result.rows.length === 0) {
    return { user: null, session: null }
  }

  const row = result.rows[0]
  return {
    user: {
      id: row.user_id,
      email: row.email,
      github_username: row.github_username,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      isPremium: row.isPremium,
      onboarding_completed: row.onboarding_completed,
    },
    session: {
      id: row.id,
      user_id: row.user_id,
      token: token, // Return plain token
      expires_at: row.expires_at,
      created_at: row.created_at,
      user_agent: row.user_agent ?? undefined,
      ip_address: row.ip_address ?? undefined,
    },
  }
}

/**
 * Delete a session by token
 */
export const deleteSession = async (token: string): Promise<void> => {
  const tokenHash = createHash('sha256').update(token).digest('hex')
  await query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash])
}

/**
 * Delete all sessions for a user
 */
export const deleteUserSessions = async (userId: string): Promise<void> => {
  await query('DELETE FROM sessions WHERE user_id = $1', [userId])
}

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = async (): Promise<number> => {
  const result = await query(
    'DELETE FROM sessions WHERE expires_at < NOW() RETURNING id'
  )
  return result.rowCount || 0
}
