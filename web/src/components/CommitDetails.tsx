import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from './ui/button'
import { CheckCircle, XCircle, Sparkles, Copy, Check, Download, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select'
import { LoadingSpinner } from './ui/loadingspinner'
import { useToast } from './ui/use-toast'
import { Commit } from '../../types/types'

interface CommitDetailsProps {
  commitDetails: Commit[]
  selectedDate?: string
}

const generateSummary = async (commits: Array<{ commitMessage: string; diff: string }>): Promise<{ summary: string; commitCount: number; type: string }> => {
  const response = await fetch('/api/mistral', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ commits }),
  })
  if (!response.ok) {
    throw new Error('Failed to generate summary')
  }
  return await response.json()
}

const CommitDetails = ({ commitDetails, selectedDate }: CommitDetailsProps) => {
  const [filteredCommits, setFilteredCommits] = useState<Commit[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([])
  const [summary, setSummary] = useState<string>('')
  const [summaryType, setSummaryType] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const users = Array.from(
      new Set(commitDetails.map((commit) => commit.commit.author.name)),
    )
    setUniqueUsers(users)
  }, [commitDetails])

  useEffect(() => {
    if (selectedUser) {
      setFilteredCommits(
        commitDetails.filter(
          (commit) => commit.commit.author.name === selectedUser,
        ),
      )
    } else {
      setFilteredCommits(commitDetails)
    }
  }, [selectedUser, commitDetails])

  const SUMMARY_LIMIT = 15

  const checkSummaryLimit = () => {
    const currentCount = parseInt(
      localStorage.getItem('summaryCount') || '0',
      10,
    )
    return currentCount < SUMMARY_LIMIT
  }

  const incrementSummaryCount = () => {
    let currentCount = parseInt(localStorage.getItem('summaryCount') || '0', 10)
    currentCount += 1
    localStorage.setItem('summaryCount', currentCount.toString())
  }

  // Function to get the storage key for a specific date
  const getSummaryStorageKey = (date: string) => `summary_${date}`

  // Load existing summary for the selected date
  useEffect(() => {
    if (selectedDate) {
      const storedSummary = localStorage.getItem(getSummaryStorageKey(selectedDate))
      const storedType = localStorage.getItem(`${getSummaryStorageKey(selectedDate)}_type`)

      if (storedSummary) {
        setSummary(storedSummary)
        setSummaryType(storedType || 'multiple')
      } else {
        setSummary('')
        setSummaryType('')
      }
    }
  }, [selectedDate])

  const summaryMutation = useMutation({
    mutationFn: generateSummary,
    onSuccess: (data) => {
      setSummary(data.summary)
      setSummaryType(data.type)

      // Store summary with date-based key
      if (selectedDate) {
        localStorage.setItem(getSummaryStorageKey(selectedDate), data.summary)
        localStorage.setItem(`${getSummaryStorageKey(selectedDate)}_type`, data.type)
      }

      incrementSummaryCount()
      console.log('Summary count:', localStorage.getItem('summaryCount'))
      toast({
        title: 'Summary generated',
        description: `Generated ${data.type} commit summary (${data.commitCount} commits)`,
      })
    },
    onError: (error) => {
      console.error('Failed to generate summary:', error)
      toast({
        title: 'Failed to generate summary',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    },
  })

  const generateSummaryForAllCommits = async () => {
    if (!checkSummaryLimit()) {
      toast({
        title: 'Summary limit reached',
        description: 'You can only generate 15 summaries per day.',
        variant: 'destructive',
      })
      return
    }

    const commits = filteredCommits.map((commit) => ({
      commitMessage: commit.commit.message,
      diff:
        Array.isArray(commit.diff) && commit.diff.length > 0
          ? commit.diff
            .map((d: { filename: string; additions: number; deletions: number }) => `${d.filename}: +${d.additions}, -${d.deletions}`)
            .join('\n')
          : '',
    }))

    summaryMutation.mutate(commits)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      toast({
        title: 'Copied to clipboard',
        description: 'Summary has been copied to your clipboard.',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      })
    }
  }

  const downloadSummary = () => {
    const blob = new Blob([summary], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commit-summary-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Summary downloaded',
      description: 'Summary has been saved as a markdown file.',
    })
  }

  const regenerateSummary = () => {
    setSummary('')
    setSummaryType('')

    // Clear stored summary for regeneration
    if (selectedDate) {
      localStorage.removeItem(getSummaryStorageKey(selectedDate))
      localStorage.removeItem(`${getSummaryStorageKey(selectedDate)}_type`)
    }

    generateSummaryForAllCommits()
  }

  if (commitDetails.length === 0) {
    return <p className="text-gray-500">No commits found for this date.</p>
  }

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* User Filter */}
          {uniqueUsers.length > 1 && (
            <div className="min-w-[140px]">
              <Select
                onValueChange={(value) =>
                  setSelectedUser(value === 'all' ? null : value)
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Filter by author" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All authors</SelectItem>
                  {uniqueUsers.map((user, idx) => (
                    <SelectItem key={idx} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Commit Count */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">
              {filteredCommits.length} commit{filteredCommits.length !== 1 ? 's' : ''}
            </span>
            {selectedUser && (
              <span className="text-gray-500">by {selectedUser}</span>
            )}
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI Summary
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={generateSummaryForAllCommits}
            disabled={summaryMutation.isPending}
            className="flex items-center gap-2 h-8 text-sm"
          >
            {summaryMutation.isPending ? (
              <LoadingSpinner />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {summary ? 'Regenerate' : 'Generate'}
          </Button>
        </div>
      </div>

      {/* AI Summary Display */}
      {summary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {/* Summary Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  {summaryType === 'multiple' ? 'Development Session Summary' : 'Commit Summary'}
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Generated from {filteredCommits.length} commit{filteredCommits.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={regenerateSummary}
                disabled={summaryMutation.isPending}
                className="h-8 w-8 p-0"
                title="Regenerate summary"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 w-8 p-0"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadSummary}
                className="h-8 w-8 p-0"
                title="Download as markdown"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Summary Content with Enhanced Styling */}
          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="prose prose-base dark:prose-invert max-w-none
                          prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                          prose-h1:text-2xl prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700 prose-h1:pb-3 prose-h1:mb-6
                          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-gray-800 dark:prose-h2:text-gray-200
                          prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-gray-700 dark:prose-h3:text-gray-300
                          prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
                          prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:mb-2
                          prose-ul:my-6 prose-ol:my-6
                          prose-li:marker:text-blue-500 dark:prose-li:marker:text-blue-400
                          prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold
                          prose-em:text-gray-600 dark:prose-em:text-gray-400 prose-em:italic
                          prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:my-6
                          prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
                          prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700
                          space-y-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {summary}
              </ReactMarkdown>
            </div>
          </div>

          {/* Summary Footer */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Generated by AI • {new Date().toLocaleString()}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {localStorage.getItem('summaryCount') || 0}/{SUMMARY_LIMIT} daily summaries used
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Commits List */}
      <div className="space-y-3">
        {filteredCommits.map((commit, idx) => {
          const status = commit.status || 'Unverified'
          const avatarUrl =
            commit.avatar_url ||
            commit.committer?.avatar_url ||
            commit.authorDetails?.avatar_url

          return (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar>
                    <AvatarImage
                      className="w-8 h-8 rounded-full"
                      src={avatarUrl}
                      alt={commit.commit.author.name}
                    />
                    <AvatarFallback className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium text-xs">
                      {commit.commit.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Commit Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed mb-1">
                        {commit.commit.message}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {commit.commit.author.name}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(commit.commit.author.date).toLocaleString('en-US', {
                            timeZone: 'UTC',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {status === 'Verified' ? (
                        <Badge className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs px-2 py-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Verified</span>
                        </Badge>
                      ) : (
                        <Badge className="flex items-center gap-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 text-xs px-2 py-1">
                          <XCircle className="h-3 w-3" />
                          <span>Unverified</span>
                        </Badge>
                      )}

                      {commit.actions?.map((action: { name: string; url: string }, actionIdx: number) => (
                        <Button
                          key={actionIdx}
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(action.url, '_blank')}
                          className="h-6 px-2 text-xs"
                        >
                          {action.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CommitDetails
