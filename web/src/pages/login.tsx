import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@/context/UserContext'
import GitHubAuthGuide from '@/components/GitHubAuthGuide'
import { LoadingSpinner } from '@/components/ui/loadingspinner'

const LoginPage = () => {
  const router = useRouter()
  const { user, isLoading } = useUser()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      setRedirecting(true)
      router.push('/dashboardv0')
    }
  }, [user, isLoading, router])

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
        <GitHubAuthGuide onComplete={handleAuthStart} />
      </div>
    )
  }

  return null
}

export default LoginPage
