import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('🔍 Checking database structure...')

    // Check if tables exist and get their structure
    const tables = ['users', 'repositories', 'commits', 'commit_summaries']
    const tableInfo: Record<string, any> = {}

    for (const tableName of tables) {
      try {
        // Get table structure by querying with limit 0
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(0)

        if (error) {
          tableInfo[tableName] = {
            exists: false,
            error: error.message,
            code: error.code,
          }
        } else {
          tableInfo[tableName] = {
            exists: true,
            count: count || 0,
            structure: 'accessible',
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
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, github_username')
        .limit(5)

      if (userError) {
        userTableTest = { error: userError.message }
      } else {
        userTableTest = {
          success: true,
          sampleCount: users?.length || 0,
          hasGithubUsers: users?.some((u) => u.github_username) || false,
        }
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
        const { data: commits, error: commitError } = await supabase
          .from('commits')
          .select('id, repo_id, message, author, date, sha, html_url, status')
          .limit(3)

        if (commitError) {
          commitStructureTest = { error: commitError.message }
        } else {
          commitStructureTest = {
            success: true,
            sampleCount: commits?.length || 0,
            sampleCommit: commits?.[0] || null,
          }
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
        const { data: repos, error: repoError } = await supabase
          .from('repositories')
          .select('id, user_id, name, owner, sync_enabled')
          .limit(3)

        if (repoError) {
          repoStructureTest = { error: repoError.message }
        } else {
          repoStructureTest = {
            success: true,
            sampleCount: repos?.length || 0,
            sampleRepo: repos?.[0] || null,
          }
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
        missingTables: tables.filter((table) => !tableInfo[table]?.exists),
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
