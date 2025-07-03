import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import { UserService } from '@/services/userService'
import { CheckCircle, Github, User, Database, ArrowRight, AlertTriangle } from 'lucide-react'

// Debug logging helper
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString()
  const logMessage = `[Auth Debug ${timestamp}] ${message}`
  console.log(logMessage)
  if (data) {
    console.log('Details:', data)
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
      debugLog('Session retrieved successfully', {
        userId: session.user?.id,
        hasProviderToken: !!session.provider_token
      })

      setStatus('Extracting GitHub token...')
      setCurrentStep(1)

      // Extract provider_token from URL fragment if available
      let githubToken = session.provider_token
      let refreshToken = session.provider_refresh_token

      // If not in session, try to extract from URL fragment
      if (!githubToken && typeof window !== 'undefined') {
        debugLog('No provider token in session, checking URL fragment')
        const urlParams = new URLSearchParams(
          window.location.hash.substring(1),
        )
        githubToken = urlParams.get('provider_token')
        refreshToken = urlParams.get('refresh_token')

        debugLog('URL fragment token check result', {
          hasGithubToken: !!githubToken,
          hasRefreshToken: !!refreshToken
        })
      }

      // Store GitHub token in database if we have one
      if (githubToken && session.user) {
        debugLog('Storing GitHub token')
        setStatus('Storing GitHub token...')
        setCurrentStep(2)
        try {
          await UserService.storeGitHubToken(
            session.user.id,
            githubToken,
            refreshToken || undefined,
          )
          debugLog('GitHub token stored successfully')
        } catch (tokenError) {
          debugLog('Failed to store GitHub token', tokenError)
          console.warn('Failed to store GitHub token:', tokenError)
        }
      } else {
        debugLog('No GitHub token available to store', {
          hasToken: !!githubToken,
          hasUser: !!session.user
        })
      }

      debugLog('Starting user data sync')
      setStatus('Syncing user data...')
      setCurrentStep(3)

      // Sync user with database
      try {
        await UserService.syncUserWithDatabase(session.user)
        debugLog('User data sync completed')
      } catch (syncError) {
        debugLog('Failed to sync user data', syncError)
        console.warn('Failed to sync user data:', syncError)
      }

      setStatus('Redirecting...')
      setCurrentStep(4)
      setIsRedirecting(true)

      // Clear the URL fragment to remove tokens from browser history
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
        debugLog('Cleared URL fragment')
      }

      // Add delay before redirect to ensure UI updates
      await delay(500)

      debugLog('Authentication successful, redirecting to dashboard')
      router.push('/dashboardv0')
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (isProcessing.current) {
        debugLog('Auth callback already in progress, skipping')
        return
      }
      isProcessing.current = true

      const maxRetries = 3
      let retryCount = 0

      while (retryCount < maxRetries) {
        try {
          debugLog('Starting auth callback handler')
          const fullUrl = window.location.href
          debugLog('Full callback URL:', fullUrl)

          // First try to get the code from URL parameters
          const urlParams = new URLSearchParams(window.location.search)
          const code = urlParams.get('code')
          const error = urlParams.get('error')
          const errorDescription = urlParams.get('error_description')
          const errorCode = urlParams.get('error_code')

          debugLog('URL Parameters:', {
            code: code ? 'present' : 'missing',
            error,
            errorCode,
            errorDescription
          })

          // Check for error in URL parameters
          if (error || errorDescription) {
            // Special handling for server_error
            if (error === 'server_error' && errorCode === 'unexpected_failure') {
              debugLog('Detected server error, attempting retry', { retryCount })
              await delay(Math.pow(2, retryCount) * 1000) // Exponential backoff
              retryCount++
              continue
            }
            throw new Error(errorDescription || error || 'Authentication failed')
          }

          // Try to get tokens from hash fragment if no code
          if (!code) {
            debugLog('No code found in URL, checking hash fragment')
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')
            const providerToken = hashParams.get('provider_token')

            debugLog('Hash Parameters:', {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken,
              hasProviderToken: !!providerToken
            })

            if (!accessToken && !providerToken) {
              throw new Error('No authentication code or tokens found in URL')
            }
          }

          setStatus('Verifying session...')
          setCurrentStep(0)

          // Exchange code for session if present
          if (code) {
            debugLog('Exchanging code for session')
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

            if (exchangeError) {
              debugLog('Code exchange error', exchangeError)
              if (exchangeError.message?.includes('rate limit') ||
                exchangeError.message?.includes('temporarily unavailable')) {
                await delay(Math.pow(2, retryCount) * 1000)
                retryCount++
                continue
              }
              throw exchangeError
            }

            debugLog('Code exchange successful', {
              hasSession: !!data?.session,
              hasUser: !!data?.user,
            })
          }

          // Verify the session with retry logic
          let session = null
          let sessionError = null
          let sessionRetryCount = 0

          while (sessionRetryCount < 3 && !session) {
            const { data: { session: currentSession }, error: currentError } =
              await supabase.auth.getSession()

            if (currentError) {
              debugLog('Session verification attempt failed', {
                attempt: sessionRetryCount + 1,
                error: currentError
              })
              sessionError = currentError
              await delay(Math.pow(2, sessionRetryCount) * 1000)
              sessionRetryCount++
              continue
            }

            if (currentSession) {
              session = currentSession
              break
            }

            sessionRetryCount++
          }

          if (sessionError) {
            debugLog('Session verification failed after retries', sessionError)
            throw sessionError
          }

          if (!session) {
            debugLog('No session found after verification attempts')
            throw new Error('No authentication session found')
          }

          debugLog('Session verified successfully', {
            userId: session.user?.id,
            hasProviderToken: !!session.provider_token,
            hasAccessToken: !!session.access_token
          })

          // Continue with the rest of your auth flow...
          await handleSuccessfulAuth(session)
          return // Success, exit the retry loop

        } catch (error) {
          debugLog('Auth callback error', error)
          console.error('Auth callback error:', error)

          // If we've exhausted retries, set the error
          if (retryCount >= maxRetries - 1) {
            setError(error instanceof Error ? error.message : 'Authentication failed')
            return
          }

          // Otherwise, retry
          retryCount++
          await delay(Math.pow(2, retryCount) * 1000)
        }
      }

      // If we get here, all retries failed
      setError('Authentication failed after multiple attempts. Please try again.')
    }

    // Only run if not already processing
    if (!error && !isRedirecting) {
      handleAuthCallback().finally(() => {
        isProcessing.current = false
      })
    }
  }, [router, error, isRedirecting])

  // Manual redirect function for error case
  const handleManualRedirect = () => {
    setIsRedirecting(true)

    // Try router first, fallback to window.location
    router.push('/login').catch(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    })
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-orange-50 dark:from-gray-900 dark:via-red-900 dark:to-gray-900">
        <div className="min-h-screen grid place-items-center p-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-200/50 dark:border-red-700/50 p-8 text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Authentication Failed
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-6 text-sm leading-relaxed">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleManualRedirect}
                disabled={isRedirecting}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRedirecting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    Return to Login
                  </>
                )}
              </button>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                Try logging in again with GitHub
              </p>

              {/* Troubleshooting tips */}
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Troubleshooting Tips
                </summary>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>• Make sure you have a stable internet connection</p>
                  <p>• Try refreshing the page and logging in again</p>
                  <p>• Clear your browser cache and cookies</p>
                  <p>• Check if GitHub is experiencing issues</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const CurrentStepIcon = steps[currentStep]?.icon || CheckCircle
  const currentStepColor = steps[currentStep]?.color || 'text-blue-500'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
      <div className="min-h-screen grid place-items-center p-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center max-w-lg">
          {/* Animated icon */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
              <CurrentStepIcon className={`w-8 h-8 ${currentStepColor}`} />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Setting up your account
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please wait while we configure everything for you
          </p>

          {/* Current status */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              {status}
            </p>
            <LoadingSpinner className="w-6 h-6 text-blue-500 mx-auto" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-center space-x-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index <= currentStep
                  ? 'bg-blue-500 scale-110'
                  : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              />
            ))}
          </div>

          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthCallback
