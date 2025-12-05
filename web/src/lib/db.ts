import { Pool, QueryResult } from 'pg'

// Create a connection pool
let pool: Pool | null = null

export const getDbPool = (): Pool => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please configure your PostgreSQL connection string.'
      )
    }

    pool = new Pool({
      connectionString,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    })

    // Handle pool errors
    pool.on('error', err => {
      console.error('Unexpected error on idle client', err)
    })
  }

  return pool
}

// Helper function to execute queries
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const pool = getDbPool()
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error', { text, error })
    throw error
  }
}

// Helper function to execute a transaction
export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const pool = getDbPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Close the pool (useful for cleanup in tests or shutdown)
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = null
  }
}
