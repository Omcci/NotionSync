import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@/context/UserContext'
import GitHubAuthGuide from '@/components/GitHubAuthGuide'
import { LoadingSpinner } from '@/components/ui/loadingspinner'

const LoginPage = () => {
  const router = useRouter()
  const { user, isLoading } = useUser()
  const [redirecting, setRedirecting] = useState(false)
  const { redirectTo } = router.query

  useEffect(() => {
    if (!isLoading && user) {
      setRedirecting(true)
      // Check if there's a redirectTo parameter from the ProtectedRoute
      const destination =
        redirectTo && typeof redirectTo === 'string' ? redirectTo : '/calendar'
      router.push(destination)
    }
  }, [user, isLoading, router, redirectTo])

  const handleAuthStart = () => {
    setRedirecting(true)
  }

  if (isLoading || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        {redirectTo && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              Please sign in to access this page
            </p>
          </div>
        )}
        <GitHubAuthGuide onComplete={handleAuthStart} />
      </div>
    )
  }

  return null
}

export default LoginPage
