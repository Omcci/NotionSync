import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('🔍 Checking database structure...')

    // Check if tables exist and get their structure
    const tables = [
      'users',
      'repositories',
      'commits',
      'commit_summaries',
      'sessions',
    ]
    const tableInfo: Record<string, any> = {}

    for (const tableName of tables) {
      try {
        // Check if table exists and get count
        const countResult = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = $1`,
          [tableName]
        )

        const exists = countResult.rows[0]?.count === '1'

        if (exists) {
          // Get row count
          const rowCountResult = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM ${tableName}`
          )
          tableInfo[tableName] = {
            exists: true,
            count: parseInt(rowCountResult.rows[0]?.count || '0', 10),
            structure: 'accessible',
          }
        } else {
          tableInfo[tableName] = {
            exists: false,
            error: 'Table does not exist',
          }
        }
      } catch (err) {
        tableInfo[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    }

    // Test a simple query on users table
    let userTableTest = null
    try {
      const result = await query<{
        id: string
        email: string | null
        github_username: string | null
      }>('SELECT id, email, github_username FROM users LIMIT 5')

      userTableTest = {
        success: true,
        sampleCount: result.rows.length,
        hasGithubUsers: result.rows.some(u => u.github_username) || false,
      }
    } catch (err) {
      userTableTest = {
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }

    // Check commit structure if commits table exists
    let commitStructureTest = null
    if (tableInfo.commits?.exists) {
      try {
        const result = await query<{
          id: string
          repo_id: string
          message: string
          author: string
          date: string
          sha: string | null
          html_url: string | null
          status: string | null
        }>(
          'SELECT id, repo_id, message, author, date, sha, html_url, status FROM commits LIMIT 3'
        )

        commitStructureTest = {
          success: true,
          sampleCount: result.rows.length,
          sampleCommit: result.rows[0] || null,
        }
      } catch (err) {
        commitStructureTest = {
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    }

    // Check repository structure if repositories table exists
    let repoStructureTest = null
    if (tableInfo.repositories?.exists) {
      try {
        const result = await query<{
          id: string
          user_id: string
          name: string
          owner: string
          sync_enabled: boolean
        }>(
          'SELECT id, user_id, name, owner, sync_enabled FROM repositories LIMIT 3'
        )

        repoStructureTest = {
          success: true,
          sampleCount: result.rows.length,
          sampleRepo: result.rows[0] || null,
        }
      } catch (err) {
        repoStructureTest = {
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    }

    console.log('✅ Database structure check completed')

    return res.status(200).json({
      message: 'Database structure check completed',
      timestamp: new Date().toISOString(),
      tables: tableInfo,
      tests: {
        userTable: userTableTest,
        commitStructure: commitStructureTest,
        repoStructure: repoStructureTest,
      },
      recommendations: {
        needsSetup:
          !tableInfo.commits?.exists || !tableInfo.repositories?.exists,
        missingTables: tables.filter(table => !tableInfo[table]?.exists),
        readyForCommits:
          tableInfo.commits?.exists && tableInfo.repositories?.exists,
      },
    })
  } catch (error) {
    console.error('❌ Database check error:', error)
    return res.status(500).json({
      message: 'Database check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}
