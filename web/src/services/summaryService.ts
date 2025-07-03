import { supabase } from '@/lib/supabaseClient'

export interface CommitSummary {
  id: string
  user_id: string
  date: string // YYYY-MM-DD format
  repo_id?: string // Optional, for repo-specific summaries
  summary: string
  commit_count: number
  created_at: string
  updated_at: string
}

export interface SummaryRequest {
  userId: string
  date: string
  repoId?: string
  commits: Array<{
    commitMessage: string
    diff: string
  }>
}

export class SummaryService {
  /**
   * Store a generated summary in the database
   */
  static async storeSummary(
    userId: string,
    date: string,
    summary: string,
    commitCount: number,
    repoId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const summaryData = {
        user_id: userId,
        date,
        repo_id: repoId || null,
        summary,
        commit_count: commitCount,
      }

      const { error } = await supabase
        .from('commit_summaries')
        .upsert(summaryData, {
          onConflict: 'user_id,date,repo_id',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error('Error storing summary:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in storeSummary:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get a stored summary from the database
   */
  static async getSummary(
    userId: string,
    date: string,
    repoId?: string,
  ): Promise<{ summary: CommitSummary | null; error?: string }> {
    try {
      let query = supabase
        .from('commit_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)

      if (repoId) {
        query = query.eq('repo_id', repoId)
      } else {
        query = query.is('repo_id', null)
      }

      const { data, error } = await query.single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error fetching summary:', error)
        return { summary: null, error: error.message }
      }

      return { summary: data || null }
    } catch (error) {
      console.error('Error in getSummary:', error)
      return {
        summary: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get summaries for a date range
   */
  static async getSummariesForDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    repoId?: string,
  ): Promise<{ summaries: CommitSummary[]; error?: string }> {
    try {
      let query = supabase
        .from('commit_summaries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (repoId) {
        query = query.eq('repo_id', repoId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching summaries:', error)
        return { summaries: [], error: error.message }
      }

      return { summaries: data || [] }
    } catch (error) {
      console.error('Error in getSummariesForDateRange:', error)
      return {
        summaries: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Delete a summary
   */
  static async deleteSummary(
    userId: string,
    date: string,
    repoId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let query = supabase
        .from('commit_summaries')
        .delete()
        .eq('user_id', userId)
        .eq('date', date)

      if (repoId) {
        query = query.eq('repo_id', repoId)
      } else {
        query = query.is('repo_id', null)
      }

      const { error } = await query

      if (error) {
        console.error('Error deleting summary:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error in deleteSummary:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Generate and store summary using AI
   */
  static async generateAndStoreSummary(
    request: SummaryRequest,
  ): Promise<{ success: boolean; summary?: string; error?: string }> {
    try {
      // Check if summary already exists
      const existingSummary = await this.getSummary(
        request.userId,
        request.date,
        request.repoId,
      )

      if (existingSummary.summary) {
        return {
          success: true,
          summary: existingSummary.summary.summary,
        }
      }

      // Generate new summary using AI
      const response = await fetch('/api/mistral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commits: request.commits }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const { summary } = await response.json()

      // Store the generated summary
      const storeResult = await this.storeSummary(
        request.userId,
        request.date,
        summary,
        request.commits.length,
        request.repoId,
      )

      if (!storeResult.success) {
        return { success: false, error: storeResult.error }
      }

      return { success: true, summary }
    } catch (error) {
      console.error('Error in generateAndStoreSummary:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get summary count for a user (for rate limiting)
   */
  static async getSummaryCount(userId: string, date?: string): Promise<number> {
    try {
      let query = supabase
        .from('commit_summaries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (date) {
        query = query.eq('date', date)
      }

      const { count, error } = await query

      if (error) {
        console.error('Error getting summary count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in getSummaryCount:', error)
      return 0
    }
  }
}
