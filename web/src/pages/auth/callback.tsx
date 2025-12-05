import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import { AlertTriangle, CheckCircle } from 'lucide-react'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const AuthCallback = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Processing authentication...')
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        const success = urlParams.get('success')
        const errorParam = urlParams.get('error')

        // Check for errors
        if (errorParam) {
          setError(decodeURIComponent(errorParam))
          setStatus('Authentication failed')
          return
        }

        // Check if we have a token
        if (success === 'true' && token) {
          setStatus('Storing session...')

          // Store token in localStorage
          localStorage.setItem('session_token', token)

          // Verify session is valid
          setStatus('Verifying session...')
          await delay(500)

          try {
            const response = await fetch('/api/auth/session', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            })

            if (!response.ok) {
              throw new Error('Failed to verify session')
            }

            setStatus('Redirecting to dashboard...')
            setIsRedirecting(true)
            await delay(500)

            // Clear URL params
            window.history.replaceState(null, '', '/auth/callback')

            // Redirect to dashboard
            router.push('/dashboardv0')
          } catch (verifyError) {
            console.error('Session verification error:', verifyError)
            setError('Failed to verify session. Please try logging in again.')
            setStatus('Authentication failed')
          }
        } else {
          // No token - might be direct GitHub redirect, redirect to login
          setError(
            'No authentication token received. Please try logging in again.'
          )
          setStatus('Authentication failed')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setError(
          error instanceof Error ? error.message : 'Authentication failed'
        )
        setStatus('Authentication failed')
      }
    }

    handleAuthCallback()
  }, [router])

  const handleManualRedirect = () => {
    router.push('/login')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center mb-6">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Authentication Error
          </h1>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm whitespace-pre-line">{error}</p>
          </div>

          <button
            onClick={handleManualRedirect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center mb-6">
          {isRedirecting ? (
            <CheckCircle className="h-12 w-12 text-green-500" />
          ) : (
            <LoadingSpinner className="h-12 w-12 text-blue-500" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
          {isRedirecting ? 'Success!' : 'Processing Authentication'}
        </h1>

        <p className="text-gray-600 text-center mb-6">{status}</p>

        {isRedirecting && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm text-center">
              Authentication successful! Redirecting...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthCallback
