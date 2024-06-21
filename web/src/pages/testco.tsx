import React, { useEffect } from 'react'

const TestApiConnection = () => {
  useEffect(() => {
    const fetchData = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      try {
        const response = await fetch(`${apiUrl}/test`)
        const data = await response.json()
        console.log('Response from backend:', data)
      } catch (error) {
        console.error('Failed to fetch from backend:', error)
      }
    }

    fetchData()
  }, [])

  return <p>Check the console for the backend connection test result.</p>
}

export default TestApiConnection
