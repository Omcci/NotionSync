import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import { UserService } from '@/services/userService'
import { CheckCircle, Github, User, Database, ArrowRight, AlertTriangle } from 'lucide-react'

// Function to decode JWT token (base64 decode the payload)
const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const AuthCallback = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Processing authentication...')
  const [currentStep, setCurrentStep] = useState(0)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const isProcessing = useRef(false)

  const steps = [
    { icon: CheckCircle, label: 'Verifying session...', color: 'text-blue-500' },
    { icon: Github, label: 'Extracting GitHub token...', color: 'text-green-500' },
    { icon: Database, label: 'Storing credentials...', color: 'text-purple-500' },
    { icon: User, label: 'Syncing user data...', color: 'text-orange-500' },
    { icon: ArrowRight, label: 'Redirecting...', color: 'text-indigo-500' },
  ]

  const handleSuccessfulAuth = async (session: any) => {
    try {
      setStatus('Extracting GitHub token...')
      setCurrentStep(1)

      // Extract provider_token from URL fragment if available
      let githubToken = session.provider_token
      let refreshToken = session.provider_refresh_token

      // If not in session, try to extract from URL fragment
      if (!githubToken && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(
          window.location.hash.substring(1),
        )
        githubToken = urlParams.get('provider_token')
        refreshToken = urlParams.get('refresh_token')
      }

      // Store GitHub token in database if we have one
      if (githubToken && session.user) {
        setStatus('Storing GitHub token...')
        setCurrentStep(2)
        try {
          await UserService.storeGitHubToken(
            session.user.id,
            githubToken,
            refreshToken || undefined,
          )
        } catch (tokenError) {
          console.warn('Failed to store GitHub token:', tokenError)
        }
      }

      setStatus('Syncing user data...')
      setCurrentStep(3)

      // Sync user with database
      try {
        await UserService.syncUserWithDatabase(session.user)
      } catch (syncError) {
        console.warn('Failed to sync user data:', syncError)
      }

      setStatus('Redirecting...')
      setCurrentStep(4)
      setIsRedirecting(true)

      // Clear the URL fragment to remove tokens from browser history
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }

      // Add delay before redirect to ensure UI updates
      await delay(500)

      router.push('/dashboardv0')
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (isProcessing.current) {
        return
      }
      isProcessing.current = true

      const maxRetries = 3
      let retryCount = 0

      while (retryCount < maxRetries) {
        try {
          const fullUrl = window.location.href

          // First try to get the code from URL parameters
          const urlParams = new URLSearchParams(window.location.search)
          const code = urlParams.get('code')
          const error = urlParams.get('error')
          const errorDescription = urlParams.get('error_description')
          const errorCode = urlParams.get('error_code')

          // Check for error in URL parameters
          if (error || errorDescription) {
            // Special handling for server_error
            if (error === 'server_error' && errorCode === 'unexpected_failure') {
              // If we've tried too many times, show a user-friendly error
              if (retryCount >= maxRetries - 1) {
                setError('GitHub authentication is temporarily unavailable. This might be due to:\n\n• GitHub service issues\n• Network connectivity problems\n• OAuth configuration issues\n\nPlease try again in a few minutes or contact support if the problem persists.')
                setStatus('Authentication failed')
                return
              }

              await delay(Math.pow(2, retryCount) * 1000) // Exponential backoff
              retryCount++
              continue
            }

            // Handle other specific errors
            if (error === 'access_denied') {
              setError('Access denied. You need to authorize the application to access your GitHub account.')
              setStatus('Authorization denied')
              return
            }

            if (error === 'invalid_request') {
              setError('Invalid authentication request. Please try logging in again.')
              setStatus('Invalid request')
              return
            }

            throw new Error(errorDescription || error || 'Authentication failed')
          }

          // Try to get tokens from hash fragment if no code
          if (!code) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')
            const providerToken = hashParams.get('provider_token')

            if (accessToken && providerToken) {
              // Decode the JWT token to get user information
              const decodedToken = decodeJWT(accessToken)

              if (decodedToken) {
                // Create a session object manually
                const session = {
                  access_token: accessToken,
                  refresh_token: refreshToken,
                  provider_token: providerToken,
                  user: {
                    id: decodedToken.sub,
                    email: decodedToken.email,
                    user_metadata: decodedToken.user_metadata || {},
                  },
                }

                // Store session in localStorage to avoid CSP issues
                try {
                  localStorage.setItem('supabase.auth.token', JSON.stringify({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_at: decodedToken.exp,
                  }))
                } catch (error) {
                  console.warn('Failed to store session in localStorage:', error)
                }

                await handleSuccessfulAuth(session)
                return
              }
            }

            throw new Error('No authentication code or tokens found in URL')
          }

          // Exchange code for session
          setStatus('Exchanging code for session...')
          setCurrentStep(0)

          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            throw exchangeError
          }

          if (!data.session) {
            throw new Error('No session returned from code exchange')
          }

          // Verify session is valid
          setStatus('Verifying session...')
          setCurrentStep(0)

          const maxSessionRetries = 3
          let sessionRetryCount = 0
          let session = null
          let sessionError = null

          while (sessionRetryCount < maxSessionRetries) {
            try {
              const { data: sessionData, error: sessionDataError } = await supabase.auth.getSession()

              if (sessionDataError) {
                sessionError = sessionDataError
                sessionRetryCount++
                await delay(1000)
                continue
              }

              if (sessionData.session) {
                session = sessionData.session
                break
              }

              sessionRetryCount++
              await delay(1000)
            } catch (error) {
              sessionError = error
              sessionRetryCount++
              await delay(1000)
            }
          }

          if (!session) {
            throw new Error('Failed to verify session after multiple attempts')
          }

          await handleSuccessfulAuth(session)
          return

        } catch (error) {
          console.error('Auth callback error:', error)

          if (retryCount >= maxRetries - 1) {
            setError(error instanceof Error ? error.message : 'Authentication failed')
            setStatus('Authentication failed')
            return
          }

          retryCount++
          await delay(Math.pow(2, retryCount) * 1000) // Exponential backoff
        }
      }

      setError('All retry attempts failed')
      setStatus('Authentication failed')
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
            <p className="text-red-800 text-sm whitespace-pre-line">
              {error}
            </p>
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
          <LoadingSpinner className="h-12 w-12 text-blue-500" />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
          {isRedirecting ? 'Redirecting...' : 'Processing Authentication'}
        </h1>

        <p className="text-gray-600 text-center mb-6">
          {status}
        </p>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep

            return (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
              >
                <Icon
                  className={`h-5 w-5 ${isCompleted ? 'text-green-500' : isActive ? step.color : 'text-gray-400'
                    }`}
                />
                <span
                  className={`text-sm font-medium ${isCompleted ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-500'
                    }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AuthCallback
