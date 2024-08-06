import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Commit } from '../../../types/types'

const CommitDetailsPage = () => {
  const [commits, setCommits] = useState<Commit[]>([])
  const router = useRouter()
  const { date, orgName, repoName } = router.query

  useEffect(() => {
    if (!date || !orgName || !repoName) return

    const fetchCommits = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const url = `${apiUrl}/api/commits_details?repoName=${repoName}&orgName=${orgName}&date=${date}`
      console.log('fetching commits for date', url)

      try {
        const response = await fetch(url)
        console.log('response:', response)
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(
            `Error fetching commits: ${response.status} - ${errorText}`,
          )
        }
        const data = await response.json()
        console.log('data:', data)
        setCommits(data)
      } catch (error) {
        console.error('Error fetching commits:', error)
      }
    }

    fetchCommits()
  }, [date, orgName, repoName])

  if (!commits.length) {
    return <p>No commits found for this date.</p>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Commits on {date}</h1>
      <ul>
        {commits.map((commit, idx) => (
          <li key={idx}>
            <p>
              <strong>{commit.commit}</strong>
            </p>
            <p>Author: {commit.author}</p>
            <p>Date: {commit.date}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CommitDetailsPage
