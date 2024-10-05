import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@/context/UserContext'
import signInWithGitHub from '@/lib/login' // Import the method from login.ts
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loadingspinner'
import { GithubIcon } from '../../public/icon/GithubIcon'

const LoginPage = () => {
  const router = useRouter()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (router.isReady && user !== null) {
      setLoading(true)
      router.push('/')
    }
  }, [user, router])

  const handleLogin = async () => {
    setLoading(true)
    await signInWithGitHub()
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen">
      <h1 className="text-3xl font-bold mb-6 mt-12">Sign in to Your Account</h1>
      <div className="flex items-center">
        <Button
          onClick={handleLogin}
        >
          <GithubIcon className="w-4 h-4 mr-2 sm:w-5 sm:h-5" />
          Sign in with GitHub
        </Button>
      </div>
    </div>
  )
}

export default LoginPage
